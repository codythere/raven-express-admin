// pages/api/auth/[...nextauth].js

import NextAuth, { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import { Admin } from "@/models/Admin";
import { mongooseConnect } from "@/lib/mongoose";

async function isAdminEmail(email) {
  if (!email) return false;
  await mongooseConnect();
  const admin = await Admin.findOne({ email });
  return !!admin;
}

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.SECRET,
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn() {
      // ✅ 任何人都可以登入
      return true;
    },
    async session({ session }) {
      const email = session?.user?.email;
      const isAdmin = await isAdminEmail(email);
      session.user = session.user || {};
      session.user.isAdmin = isAdmin;
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};

export default NextAuth(authOptions);

// ✅ 不再寫 401、不丟 Error，只回 true / false
export async function isAdminRequest(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const ok = await isAdminEmail(session?.user?.email);
  return ok;
}
