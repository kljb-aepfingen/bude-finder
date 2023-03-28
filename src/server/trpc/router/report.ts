import {protectedProcedure, router} from '../trpc'
import {reportValidator} from '@/utils/validators'
import {TRPCError} from '@trpc/server'
import type {Report} from '@prisma/client'

export const reportRouter = router({
  types: protectedProcedure.query(async ({ctx}) => {
    const ownReport = await ctx.prisma.report.findFirst({where: {
      userId: ctx.session.user.id
    }})
    if (ownReport) {
      return {types: null}
    }
    return {
      types: await ctx.prisma.reportType.findMany()
    }
  }),
  add: protectedProcedure.input(reportValidator).mutation(async ({ctx, input}) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    const type = await ctx.prisma.reportType.findFirst({where: {id: input.typeId}})

    if (!type) {
      throw new TRPCError({code: 'NOT_FOUND'})
    }

    const data: Report = {
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
  })
})