import NextAuth from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";


const handler = NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: 'common',
      authorization: {
        url: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        params: {
          scope: "api://3af57c76-7425-4946-a2ce-f3bd2930c21d/access_as_user",
          response_type: "code",
          state: "enabled",
        },
      },
      token: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      httpOptions: {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${process.env.AZURE_AD_CLIENT_ID}:${process.env.AZURE_AD_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session }) {

      return session;
    },
  },
});

export { handler as GET, handler as POST };
