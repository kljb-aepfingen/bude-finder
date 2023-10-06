import z from 'zod'
import {protectedProcedure, router} from '../trpc'
import {reportValidator} from '@/utils/validators'
import {TRPCError} from '@trpc/server'
import type {Report} from '@prisma/client'

export const reportRouter = router({
  types: protectedProcedure.input(z.object({
    budeId: z.string().cuid()
  })).query(async ({ctx, input}) => {
    const ownReport = await ctx.prisma.report.findFirst({where: {
      userId: ctx.session.user.id,
      budeId: input.budeId
    }})
    if (ownReport) {
      return {types: null}
    }
    return {
      types: await ctx.prisma.reportType.findMany()
    }
  }),
  add: protectedProcedure.input(reportValidator).mutation(async ({ctx, input}) => {
    const type = await ctx.prisma.reportType.findFirst({where: {id: input.typeId}})

    if (!type) {
      throw new TRPCError({code: 'NOT_FOUND'})
    }

    const data: Omit<Report, 'createdAt'> = {
      budeId: input.budeId,
      typeId: type.id,
      userId: ctx.session.user.id,
      description: null,
      contact: null
    }
    if (type.description) {
      if (!input.description) {
        throw new TRPCError({code: 'BAD_REQUEST'})
      }
      data.description = input.description
    }
    if (type.contact) {
      if (!input.contact) {
        throw new TRPCError({code: 'BAD_REQUEST'})
      }
      data.contact = input.contact
    }

    return ctx.prisma.report.create({data})
  }),
  delete: protectedProcedure.input(z.object({
    budeId: z.string().cuid()
  })).mutation(({ctx, input}) => {
    return ctx.prisma.report.delete({
      where: {
        userId_budeId: {
          budeId: input.budeId,
          userId: ctx.session.user.id
        }
      }
    })
  })
})