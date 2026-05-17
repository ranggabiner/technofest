export function buildAdminInvitationEmail(input: {
  invitedEmail: string;
  loginUrl: string;
}) {
  const invitedEmail = input.invitedEmail.trim().toLowerCase();

  return {
    subject: "Undangan admin MedProof",
    text: [
      "Anda diundang untuk mengakses dashboard Admin MedProof.",
      "",
      `Login: ${input.loginUrl}`,
      "",
      `Gunakan akun Google/email yang sama dengan alamat yang diundang: ${invitedEmail}.`,
      "Jika Anda login dengan akun Google/email lain, akses admin tidak akan diberikan.",
    ].join("\n"),
  };
}
