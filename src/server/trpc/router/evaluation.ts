import {z} from 'zod'
import {protectedProcedure, publicProcedure, router} from '../trpc'

const validator = z.object({
  id: z.string(),
  like: z.boolean()
})

export const evalRouter = router({
  get: publicProcedure.input(z.object({
    id: z.string()
  })).query(async ({ctx, input}) => {
    const likes = await ctx.prisma.evalutation.aggregate({
      where: {budeId: input.id, like: true},
      _count: true
    })
    const dislikes = await ctx.prisma.evalutation.aggregate({
      where: {budeId: input.id, like: false},
      _count: true
    })

    if (!ctx.session || !ctx.session.user) {
      return {likes, dislikes, own: null}
    }

    const own = await ctx.prisma.evalutation.findFirst({
      where: {
        budeId: input.id,
        AND: {
          userId: ctx.session.user.id
        }
      },
      select: {
        like: true
      }
    })
    return {
      own: own === null ? {like: null} : own,
      likes,
      dislikes
    }
  }),
  set: protectedProcedure.input(validator).mutation(async ({ctx, input}) => {
    return await ctx.prisma.evalutation.create({
      data: {
        budeId: input.id,
        userId: ctx.session.user.id,
        like: input.like
      }
    })
  }),
  update: protectedProcedure.input(validator).mutation(async ({ctx, input}) => {
    await ctx.prisma.evalutation.update({
      where: {
        userId_budeId: {
          budeId: input.id,
          userId: ctx.session.user.id
        }
      },
      data: {
        like: input.like
      }
    })
  }),
  delete: protectedProcedure.input(z.object({
    id: z.string()
  })).mutation(async ({ctx, input}) => {
    return await ctx.prisma.evalutation.delete({
      where: {
        userId_budeId: {
          budeId: input.id,
          userId: ctx.session.user.id
        }
      }
    })
  })
})