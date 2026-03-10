const handler = async (m, { conn }) => {
  await conn.sendMessage(
    m.chat,
    { text: "\n".repeat(9999) },
    { quoted: m.fakeObj || m }
  );
};

handler.command     = ["clear"];
handler.category    = "owner";
handler.owner       = true;
handler.description = "Clear chat dengan pesan newline panjang";

export default handler;