import { PrismaClient } from '@prisma/client';
import { magicCodeService } from './magicCodeService';

const prisma = new PrismaClient();

async function getInvitation(token: string) {
  return prisma.invitationToken.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          clientProfile: {
            include: {
              therapist: { include: { user: true } }
            }
          }
        }
      }
    }
  });
}

export const onboardingService = {
  async verifyToken(token: string) {
    const invitation = await getInvitation(token);
    if (!invitation) return null;
    if (!invitation.isActive || invitation.usedAt) return null;
    if (invitation.expiresAt < new Date()) return null;
    return invitation;
  },

  async requestMagicCode(token: string, email: string) {
    const invitation = await this.verifyToken(token);
    if (!invitation || invitation.user.email !== email) return null;
    const code = await magicCodeService.generateCode(email, invitation.userId);
    return { code }; // In production we would send via email
  },

  async verifyMagicCode(token: string, email: string, code: string) {
    const invitation = await this.verifyToken(token);
    if (!invitation || invitation.user.email !== email) return null;
    const result = await magicCodeService.verifyCode(email, code);
    if (!result.valid) return null;
    await prisma.invitationToken.update({
      where: { id: invitation.id },
      data: { usedAt: new Date(), isActive: false }
    });
    await prisma.user.update({
      where: { id: invitation.userId },
      data: {
        isActive: true,
        authProvider: 'email',
        authProviderId: email
      }
    });
    return invitation.user;
  },

  async recordOAuth(token: string, provider: string, providerId: string) {
    const invitation = await this.verifyToken(token);
    if (!invitation) return null;
    await prisma.user.update({
      where: { id: invitation.userId },
      data: {
        isActive: true,
        authProvider: provider,
        authProviderId: providerId
      }
    });
    await prisma.invitationToken.update({
      where: { id: invitation.id },
      data: { usedAt: new Date(), isActive: false }
    });
    return invitation.user;
  },

  async updateOnboardingStage(clientId: string, stage: string) {
    return prisma.clientProfile.update({
      where: { id: clientId },
      data: { onboardingStage: stage as any }
    });
  }
};
