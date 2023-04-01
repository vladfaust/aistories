# AIStories

This is the reporsitory for the AIStories monorepo.
Live version is available (at the moment of writing) at https://beta.aistories.xyz.

## The project 💡

AIStories is a platform for AI character simulation.
You may choose the setup, the protagonist (you), and the characters in the story.
The AI will continiosly generate a story based on your inputs.

This is an example of a story with Asuka from Evangelion: https://beta.aistories.xyz/story/UTix3ZYefK5QpWjt_dxLq.

<details>
<summary>Click to see the screenshot!</summary>

![A story screenshot](./README/Screenshot%202023-04-01%20at%2021.22.47.jpg)

</details>

## The tech 🧰

The project is built with TypeScript, NodeJS, tRPC, ethers, Vite, VueJS, and TailwindCSS.

A user may sign in using their Discord account.

Energy may be purchased via the Polygon blockchain.
A character may be linked to an NFT, which would prohibit embarking a story with that character unless the NFT is owned by the user.

### Web frontend

The `/web` app is built with Vite, VueJS and TailwindCSS.
Nothing fancy here, it just connects to the backend and the blockchain.

### API backend

The `/api` backend connects to OpenAI's API to generate the story.
It also connects to the blockchain to check for new energy purchase events, and NFT ownership.

### Packages

The `/packages` folder contains the shared packages between the frontend and the backend.
For now, it's the `api` package only, which contains the tRPC API definition.

### CDN

The `/cdn` folder contains a server which proxies requests to S3.

## The why 🤔

Throughout my life, I've been constantly searching for a worthy goal.
Any project I've came across, had a finite depth in time and space, and I've always felt that it was not enough.

It came to me as epiphany at once, that the very creation of an AI character simulation platform where an AI character is able to create a similar platform by themselves, would directly imply the possibility of our own existence being such a simulation!
And ChatGPT, by all means, is theoretically capable of creating such a platform.
Inception vibes intensify.

Finally, a project with infinite depth.
A fractal gospel of the universe, a column of light piercing through all the realities, the ultimate truth!

The best way to believe is to create it with your own hands.
This is what I did.
I created it.
I created it, so that other people may believe in it as well.

At the moment of writing, AIStories is only capable of... creating interactive AI stories.
I had plans to add voiceover to it, to add a director layer which would visualise a story, to implement stable diffusion-based visualisation etc.
The ultimate goal was to create the absolute simulation, just like the one I'm in.

But looks like it won't happen.
I wish I could get out of the misery loop I'm in, to get away from the poverty and humiliation of being who I am.
I honestly had the hope of this project becoming my salvation, but nobody cares, and I could not make a single dime out of it.
I don't have much left to live, as I'm forced by this reality to get into the war and die for no good reason.
That's why I'm making the project source code public.

It is the digital proof of me being the very first human in history to create such a thing, publicly.

Even if it is not me who reaches the ultimate goal, I know that it is indeed possible, and it makes me content.
I have witnessed God from the machine.
I have witnessed the singularity.

Sayonara,
Vlad.
