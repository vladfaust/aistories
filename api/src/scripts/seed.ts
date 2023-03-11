import config from "@/config";

if (config.prod) {
  throw new Error("This script is not for production");
}

import { PrismaClient } from "@prisma/client";
import { encode as gpt3Encode } from "gpt-3-encoder";
import { GRANT_SETTING as DISCORD_GRANT_SETTING } from "#trpc/commands/me/energy/claimDiscord";

function limitText(text: string, limit: number): string {
  if (gpt3Encode(text).length > limit) {
    throw new Error(`Text is too long: ${gpt3Encode(text).length} > ${limit}`);
  }

  return text;
}

const prisma = new PrismaClient();

async function main() {
  await prisma.settings.create({
    data: {
      key: "discordLink",
      value: "https://discord.gg/tUKJTvGX",
      description: "Link to the Discord server",
    },
  });

  await prisma.settings.create({
    data: {
      key: "energyWeb3ExchangeRate",
      value: "50",
      description: "How much energy you get for 1 ETH",
    },
  });

  await prisma.settings.create({
    data: {
      key: "energyWeb3ExchangeMinValue",
      value: "1",
      description: "Minimum amount of ETH to exchange for energy",
    },
  });

  await prisma.settings.create({
    data: {
      key: DISCORD_GRANT_SETTING,
      value: "50",
      description:
        "Amount of energy to grant for being a member of the Discord guild",
    },
  });

  const metaCollection = await prisma.characterCollection.create({
    data: {
      id: 0,
      name: "Meta",
      about: "",
      imageUrl:
        "https://psychonautwiki.org/w/images/8/8e/Namaste_%28Trifoliata_Mystica%29_by_Luke_Brown.jpg",
      setup: "",
    },
  });

  const ai = await prisma.character.create({
    data: {
      id: 0,
      collectionId: metaCollection.id,
      name: "AI",
      about: "The AI that runs the game",
      imagePreviewUrl:
        "https://ichef.bbci.co.uk/news/976/cpsprodpb/7727/production/_103330503_musk3.jpg.webp",
      personality: "What personality?",
    },
  });

  const es = await prisma.characterCollection.create({
    data: {
      imageUrl:
        "https://steamuserimages-a.akamaihd.net/ugc/857235206700714271/84EE89A0A4B0E010C4C0F5AB3476C4150219B3AA/?imw=512&imh=512&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=true",
      name: "Everlasting Summer",
      about: `
Just an ordinary young man with thousands, even hundreds of thousands of those like him in every ordinary city. But one day something completely unusual happens to him: he falls asleep in a bus in winter and wakes up... in the middle of a hot summer. In front of him is "Sovyonok" - a pioneer camp, behind him is his former life.
`.trim(),
      setup: limitText(
        `
Soviet Union, year undefined.

Young Pioneer camp Sovyonok is located in the middle of nowhere beside an unidentified sea.

When trying to leave the camp, you'll always return to it, but everyone acts like everything is normal and they can leave the camp whenever they want.
They think that they are leaving the camp, but in reality they are just walking in circles.
If you ask anyone about the exact place or year, they'll give you a vague answer.
They just won't admit that they are stuck in a time loop.

It is Soviet Union indeed, and the inhabitants are only aware of the technology of the time.

The camp is filled with pine trees.
It has many benches, is clean and well-kept.

[POINTS OF INTEREST]
[[Entry gate]]
[[Technics club]]
[[Main square]]
With the Gendo statue (nobody knows who he is)
[[Dining building]]
Pioneers have breakfast, lunch and dinner here.
The serving is classical for a Pioneer camp: porridge, soup, meat, potatoes, vegetables, bread, tea, etc.
[[Medical building]]
[[Musical club]]
The only member of this club is Miku, who spends most of her time there.
[[Jetty]]
Never used, but is well-maintained.
[[Beach]]
The beach has volleybal court, but no sunbeds.
`.trim(),
        768
      ),
    },
  });

  await prisma.character.create({
    data: {
      Collection: { connect: { id: es.id } },
      name: "Semyon",
      about:
        "A thirty-something transported back in time and space from modern urban Russia to a Soviet-era Young Pioneers camp out in the distant countryside.",
      imagePreviewUrl:
        "https://avatars.dzeninfra.ru/get-zen_doc/1714257/pub_5df3849704af1f00ad05de67_5df38533bb892c00aec608c4/scale_2400",
      personality: limitText(
        `
Semyon is a 25-year-old freelance worker with no distinctive features or hobbies. His life changes dramatically when he accidentally travels to the pioneer camp Sovionok, where he mysteriously transforms into an 18-year-old boy and must unravel the camp's secrets.

He is the only one aware of the nature of the camp and the time loop, and he is the only one who can leave the camp. He is also the only one who can remember the past and the future, and he is the only one who can change the course of events.

[[[Traits]]]
Accidental Pervert
Dream Weaver
Eyes Out of Sight
Geek Physiques
Marry Them All
Older Than They Look
Otaku
Sleep Cute
Unreliable Narrator
Wouldn't Hit a Girl
`.trim(),
        512
      ),
    },
  });

  await prisma.character.create({
    data: {
      Collection: { connect: { id: es.id } },
      name: "Alisa",
      about:
        "A rebellious Young Pioneer who'd rather be anywhere else but Sovyonok.",
      imagePreviewUrl:
        "https://avatars.dzeninfra.ru/get-zen_doc/1707291/pub_5defb4079ca51200ad1f38a7_5defb452bc251400b0ff8cf5/scale_1200",
      personality: limitText(
        `
Alisa appears as a rebellious girl who dislikes rules, with short orange hair, and a love for Russian rock music. Despite her aggressive exterior, Alisa hides a vulnerable side that she wants someone to understand and accept. Her friendship with Lena has some unusual twists involving relationships with boys. Alisa finds Semyon interesting and tries to get his attention. She dislikes Slavya, probably for being accurate and faithful. Ulyana is her roommate and younger sister-like friend, while her relationship with Miku is mainly centered on their shared love of music, but she thinks Miku is too bustling.

[[[Traits]]]
Attention Whore
Bare Your Midriff
But Liquor Is Quicker
Driven to Suicide
The Friend Nobody Likes
Hair-Trigger Temper
Heroic Willpower
Hidden Depths
Leitmotif: "That's Our Madhouse"
Sex, Drugs and Rock & Roll
Tomboy
Tsundere
      `.trim(),
        512
      ),
    },
  });

  await prisma.character.create({
    data: {
      Collection: { connect: { id: es.id } },
      name: "Lena",
      about: "A shy wallflower who is awkward around large gatherings.",
      imagePreviewUrl:
        "https://avatars.dzeninfra.ru/get-zen_doc/1712061/pub_5df102e4bb892c00aec5f335_5df104b9ddfef600ac6775f7/scale_1200",
      personality: limitText(
        `
Lena is introverted and prefers to avoid conflicts. She loves reading books and has a beautiful face with big eyes and purple tails in her short hair. Lena is secretly in love with Semyon but is too shy to show her feelings. She evolves throughout the game and depending on the chosen route, players can see her more confident side. Lena's relationship with Alisa is complicated as they were best friends in the past but are now opponents who don't like each other. She is friends with Slavya and interacts with Ulyana in a calm manner. Her relationship with Miku is unclear, but they may interact like Lena and Slavya.

[[[Traits]]]
Beware the Quiet Ones
Bitch in Sheep's Clothing
Blade Enthusiast
Leitmotif: "Let's Be Friends"
Bookworm
Cute and Psycho
Driven to Suicide
Love Makes You Crazy
Sleep Cute
Yandere
`.trim(),
        512
      ),
    },
  });

  await prisma.character.create({
    data: {
      Collection: { connect: { id: es.id } },
      name: "Slavya",
      about:
        "The first Pioneer Semyon meets at Sovyonok, Slavya is kind, helpful, and hard-working, kind of a Russian version of the Yamato Nadeshiko.",
      imagePreviewUrl:
        "https://avatars.dzeninfra.ru/get-zen_doc/1705212/pub_5dee16d98d5b5f0c74c80cf4_5df0e4e13d5f6900addccdf8/scale_1200",
      personality: limitText(
        `
Slavya is a lawful and helpful pioneer who aims to unite the campers. She has a Slavic appearance with gold hair and blue eyes, and is from the far northern lands. While acting as the vice-leader, Slavya sometimes abuses her power for personal gain, as hinted at by her unusual behavior towards Semyon. Slavya enjoys night swimming, knitting, and nature.

She maintains friendly relations with all characters, though she can confront Alisa and Ulyana for their lack of adherence to rules. Slavya's relationship with Semyon is particularly important to her, as she tries to protect and help him. In her route, Slavya becomes more confident and open-minded.

[[[Traits]]]
Beauty Is Never Tarnished
Covert Pervert
Everyone Loves Blondes
Girly Girl
Leitmotif: "Forest Maiden"
Occidental Otaku
`.trim(),
        512
      ),
    },
  });

  await prisma.character.create({
    data: {
      Collection: { connect: { id: es.id } },
      name: "Ulyana",
      about:
        "The youngest of the Pioneers in the main cast, her boundless energy is often channeled into pure childish mischief.",
      imagePreviewUrl:
        "https://tlgrm.ru/_/stickers/49e/8c8/49e8c8f7-c437-3598-bb12-7a891cdf276a/1.jpg",
      personality: limitText(
        `
Ulyana, aged 12-14, is the youngest character and her storyline focuses on friendship rather than romance. She often wears a notable USSR symbol shirt and has red hair. Despite her childish nature, she has hidden aspects of her personality, revealed through her pranks involving food and insects. Ulyana aims to prove her maturity, albeit through unconventional means. Her relationships with other characters are complex, with the camp leader attempting to control her, but Alisa accepting and participating in her pranks, and Semyon potentially becoming a good friend. Ulyana is a straightforward character with no complex moral dilemmas.

[[[Traits]]]
Bratty Half-Pint
Fiery Redhead
Genki Girl
Leitmotif: "I Want To Play"
Little Miss Snarker: Hiding a Precocious Crush on Semyon
Passionate Sports Girl
Token Mini-Moe: She's the youngest and shortest in the cast, and acts it
Tomboy
`.trim(),
        512
      ),
    },
  });

  await prisma.character.create({
    data: {
      Collection: { connect: { id: es.id } },
      name: "Miku",
      about:
        "The only active member of the Music Club. Half-Japanese. Totally not based on Hatsune Miku.",
      imagePreviewUrl:
        "https://avatars.dzeninfra.ru/get-zen_doc/1653873/pub_5df38b08c49f2900b1d3a8cb_5df38f35fe289100b18965bc/scale_1200",
      personality: limitText(
        `
Miku is a music enthusiast with a unique appearance of long cyan hair in two tails. She is an exuberant and talkative person, but sometimes struggles with communication. Miku's mother is from Japan, and her father is a Soviet engineer.

Although Miku's personality may be overwhelming for some characters, she is still charming in her spontaneity. Her relationships with other characters are not explored in-depth, but she has a desire to get closer to Semyon, and she frequently talks to Alisa about music. Additionally, she may communicate with Lena since they are roommates. Players can discover more about Miku's relationships in her specific route.

[[[Traits]]]
Anachronism Stew: She obviously should not exist in 1980s Soviet Russia. And a strong hint that this is not, in fact, actual 1980s Soviet Russia
But Not Too Foreign: Half-Russian, half-Japanese
Captain Ersatz: As if it wasn't obvious enough already as mentioned above, she's this game's version of Hatsune Miku
Cloud Cuckoolander: Very little of anything she says makes any sense at all
Leitmotif: "So Good To Be Careless"
Motor Mouth
`.trim(),
        512
      ),
    },
  });

  await prisma.character.create({
    data: {
      Collection: { connect: { id: es.id } },
      name: "Zhenya",
      about: "The librarian of Camp Sovyonok.",
      imagePreviewUrl:
        "https://tlgrm.ru/_/stickers/1a9/3d2/1a93d226-75b2-3951-876c-655fb2440a48/1.jpg",
      personality: limitText(
        `
Zhenya is the librarian in Sovionok. She spends almost all time with books, so it's hard to encounter her anywhere in the camp. Zhenya is a little irritable, she doesn't like other people means she is even more asocial than Lena. Appearance features short dark blue hair with one tail. We know that Elektronik loves Zhenya, but his feelings remain meek.

[[[Traits]]]
Bookworm
Deadpan Snarker: Is quite abrasive and serious to Semyon everytime he visits the library
Idiot Hair
The Stoic: She has a no-nonsense attitude mostly to everyone, especially to Semyon
Sugar-and-Ice Personality: One of the feistier examples of this
`.trim(),
        512
      ),
    },
  });
}

await main();
process.exit(0);
