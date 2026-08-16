import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db.js";
import { awardSignupBonus } from "../services/credit.service.js";

const appUrl = process.env.CLIENT_URL ?? "http://localhost:3000";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL ?? appUrl,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [appUrl],
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }
    },

    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    // Award free credits to every new user on signup.
                    await awardSignupBonus(user.id).catch((err) => {
                        console.error("[Credits] Failed to award signup bonus:", err);
                    });
                },
            },
        },
    },
});