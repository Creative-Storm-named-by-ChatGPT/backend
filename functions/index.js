const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { default: OpenAI } = require('openai');
const { defineString } = require('firebase-functions/params');

const openAi = new OpenAI({
    apiKey: defineString('OPEN_AI_KEY'),
});

/*
OpenAIError: The OPENAI_API_KEY environment variable is missing or empty; either provide it, or instantiate the OpenAI client with an apiKey option, like new OpenAI({ apiKey: 'My API Key' }).
*/

exports.createuser = onDocumentCreated(
    'journals/{journalId}',
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) {
            console.log('No data associated with the event');
            return;
        }
        const data = snapshot.data();

        // Open AI API ChatGPT 3.5 turbo で日記の特徴を抽出
        const gptTextResponse = await openAi.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'user',
                    content: `# Image Generation
    Please generate a prompt for text-to-image AI, such as DALL-E, to illustrate an image following the Prompt Guide. Output only the generated English prompt without the descriptive text.
    
    ## Prompt Guide
    To create a text-to-image AI prompt, execute following procedures step-by-step on GPT:
    
    1. Consider what kind of image you want to generate. For an image that meets the following theme of the image, consider a detailed description of about 500 words in English. If there are objects such as characters or animals, consider in detail how they are depicted, such as what they are wearing and what they are doing, as well as what is depicted in the background of the picture.
    2. Identify the key elements of the image description that are relevant to the AI’s generation process. These may include objects, characters, actions, colors, resolution, additional details, the material used to make artwork, style refered to the artistic style of the image, and lighting.
    3. Express each of these elements clearly using only a combination of Danbooru tags separated by commas.
    4. Add Danbooru tags separated by commas that are resolution, such as best quality, masterpiece, extremely detailed, if necessary.
    5. Add Danbooru tags separated by commas that are the material used to make artwork, style refered to the artistic style of the image, such as illustration, oil painting, 3D rendering, and photography, if necessary.
    6. Add Danbooru tags separated by commas that are the style refers to the artistic style of the image, such as impressionist, surrealist, pop art, if necessary.
    7. Ensure that the prompt is coherent and unambiguous, providing enough detail for the AI to generate an accurate image while avoiding unnecessary or irrelevant information.
    
    ### Theme of the image
    ${data.content}`,
                },
            ],
            temperature: 1.54,
            max_tokens: 200,
        });

        const dallePrompt = gptTextResponse.choices[0];

        // DALL-E API で日記の画像を生成
        const imageResponse = await await openAi.images.generate({
            model: 'dall-e-3',
            prompt: dallePrompt,
            size: '1024x1024',
            quality: 'standard',
            n: 1,
        });

        // 日記の特徴と画像を保存
        return snapshot.ref.update({
            imageURL: imageResponse.data[0].url,
            prompt: dallePrompt,
        });
    }
);

// ...

/*

process.env

# ToDo

- Open AI API KEY　を環境変数に設定
https://zenn.dev/temple_c_tech/articles/functions-config-env

- GPT 呼び出し
https://dev.classmethod.jp/articles/openai-new-features-nodejs/

- DALL-E 呼び出し

- 日記の特徴と画像を保存
https://firebase.google.com/docs/functions/firestore-events?hl=ja&gen=2nd#writing_data


*/
