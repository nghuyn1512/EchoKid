import NextAuth, {NextAuthOptions} from "next-auth"
import Google from "next-auth/providers/google"
import { getOrCreateUser } from "@/services/firestore.service";
async function refreshAccessToken(token:any){
    try{
        const url = "https://oauth2.googleapis.com/token?" + new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refreshToken,
        });
        const response = await fetch(url,{method: "POST"});
        const refreshed = await response.json();
        if (!response.ok) throw refreshed;
        return{
            ...token,
            accessToken: refreshed.access_token,
            accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
            refreshToken: refreshed.refresh_token ?? token.refreshToken,
            error: undefined,
        };
    } catch (error) {
        console.error(error);
        return{...token,error: "RefreshAccessTokenError"};
    }
}

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        const firestoreUser = await getOrCreateUser({
          uid: account.providerAccountId,
          email: user.email ?? "",
          name: user.name ?? "",
          avatarUrl: user.image ?? "",
        });
 
        return {
          ...token,
          uid: firestoreUser.uid,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: (account.expires_at ?? 0) * 1000,
        };
      }
 
      if (
        token.accessTokenExpires &&
        Date.now() < (token.accessTokenExpires as number)
      ) {
        return token;
      }
 
      return refreshAccessToken(token);
    },

    async session({ session, token }) {
      session.user.id = token.uid as string;
      session.accessToken = token.accessToken as string;
      session.error = token.error as string | undefined;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };