import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API Client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini Client:", err);
  }
} else {
  console.log("No GEMINI_API_KEY found or using placeholder. Running in fallback mode with pre-curated articles.");
}

// Pre-curated high-fidelity articles matching mockups and providing premium fallbacks
const SEED_ARTICLES = [
  {
    id: "asean-turkiye-2026",
    title: "ASEAN–Türkiye Conference Explores Strategic Partnership and Cultural Ties",
    source: "ASEAN Main Portal",
    sourceIconUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDpagBZ90tlR3JJUa0mgjVWqhyQjNEE4kzKaftUitv1YsBKtF-ce3ynt5hS8rCh0n136QFwdxW68PRHBJ8TEicowX4CzVv3RK6Tlj8hA1UpwrV2c9FQuzlaJ6FJ0GvAa2KCvxZd9DTorCfEYjOWdklEib7nXZINqbQObRmQs0RPiOiF43vKVo12JcYXXoMUBi8oTT9jvJGgEMc-AAVe5Ex1Q8cWH7BgMrumyB7XX7jfKMlPZSkbUWYzaws7bjh5Jx-5ctsP55D8d31d",
    imageUrl: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&auto=format&fit=crop",
    summary: "Diplomats and policymakers gather in Istanbul to strengthen trade, digital infrastructure, and education networks across Southeast Asia and Türkiye.",
    content: "The ASEAN–Türkiye strategic dialogue concluded in Istanbul today, with delegates agreeing to expand collaborative frameworks in key areas such as trade, digital economy transition, renewable energy, and higher education. The conference highlighted the growing significance of Türkiye as a dialogue partner, facilitating bridges between ASEAN's vibrant markets and Eastern Europe.\n\nSpeaking at the plenary, foreign ministers emphasized that the bilateral trade volume aims to surpass $5 billion by next year, backed by modern trade corridors and simplified customs agreements. Cultural exchanges and vocational training scholarship programs were also unveiled to foster people-to-people relations.\n\nAdditionally, discussions centered heavily on collaborative cybersecurity drills and digital infrastructure investments. ASEAN representatives noted that Türkiye's expertise in defense technology and engineering projects offers valuable collaboration opportunities for infrastructure expansion in emerging Southeast Asian metropolitan areas.",
    bullets: [
      "Targeted bilateral trade volume set to cross $5 billion with simplified custom procedures.",
      "New scholarship networks and cultural exchange centers to launch across Southeast Asia and Türkiye.",
      "High-level cybersecurity drills and tech infrastructure collaborations scheduled for late 2026."
    ],
    time: "17 hours ago",
    category: "world",
    featured: false,
    url: "https://asean.org"
  },
  {
    id: "brazil-japan-worldcup",
    title: "Martinelli scores late as Brazil beat Japan 2-1, into World Cup last 16",
    source: "Al Jazeera",
    sourceIconUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA7d3VU-88_vY775UL5cXhUu-S_QNV0VPAkA7QCEAvRKLhmPAJbKOU-bOx5rpJ6AA_G8uAMVFE2aUptyhvMak9UlqIZ7ZnGVWpKoFLRpAiVlA03Pb3bnuUpzYPLExRRqEgzhOjAukMPTMut1XkqnGjIcB9dONJJfzAi_zSRwSm8iOepvsTusV7ASnDyAkUSZizoiOL2Ys_1VQJPByt_nQ182Ssw9VQs1NboFvLiH5_JDiNjwMgteymLtxRrUpGjQm_gzaRPpRx_31s7",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuA7d3VU-88_vY775UL5cXhUu-S_QNV0VPAkA7QCEAvRKLhmPAJbKOU-bOx5rpJ6AA_G8uAMVFE2aUptyhvMak9UlqIZ7ZnGVWpKoFLRpAiVlA03Pb3bnuUpzYPLExRRqEgzhOjAukMPTMut1XkqnGjIcB9dONJJfzAi_zSRwSm8iOepvsTusV7ASnDyAkUSZizoiOL2Ys_1VQJPByt_nQ182Ssw9VQs1NboFvLiH5_JDiNjwMgteymLtxRrUpGjQm_gzaRPpRx_31s7",
    summary: "Gabriel Martinelli nets a dramatic 89th-minute volley to secure Brazil's spot in the knockout stages of the World Cup after Japan's relentless defensive showcase.",
    content: "Brazil secured an emotional spot in the World Cup Round of 16 following a nail-biting 2-1 triumph over an organized Japan side. With the match poised at 1-1 and heading toward a tense finish, substitute Gabriel Martinelli turned hero, latching onto a brilliant lofted cross from Vinícius Júnior and smashing a superb volley into the top corner in the 89th minute.\n\nJapan had initially shocked the South American giants by taking the lead in the first half through a spectacular counter-attack finished clinicaly by Kaoru Mitoma. Brazil responded shortly after the break when Rodrygo tapped home a low rebound, setting up a relentless second-half siege that culminated in Martinelli's dramatic decider.\n\nJapan's manager praised his side's resilience and structural discipline, which kept the Seleção at bay for long spells. However, Brazil's tactical adjustments in the final twenty minutes eventually unlocked Japan's tiring backline, sending the Brazilian contingent in the stadium into pure delirium as they march forward with title hopes intact.",
    bullets: [
      "Gabriel Martinelli strikes an outstanding 89th-minute volley to seal Brazil's 2-1 victory.",
      "Kaoru Mitoma scored a stunning first-half counter-attack goal to put Japan ahead.",
      "Brazil advances safely into the World Cup Round of 16 after topping their competitive group."
    ],
    time: "15 hours ago",
    category: "sports",
    featured: true,
    url: "https://www.aljazeera.com/sports"
  },
  {
    id: "gemini-releases-2026",
    title: "Google rolls out Gemini 3.5 with Real-Time Reasoning and Vision Capabilities",
    source: "TechCrunch",
    sourceIconUrl: "",
    imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop",
    summary: "Google's newest AI model breakthrough features complex logic processing, sub-second latency, and native multimodal speech synthesis.",
    content: "Google today announced the public release of its flagship model family, Gemini 3.5. Representing a significant leap in native multimodal understanding, the new model processes complex codebases, mathematical proofs, and live sensory feeds in real time. It introduces an optimized reasoning engine that dynamically determines the cognitive 'thinking level' needed for tasks.\n\nAccording to technical benchmarks published by Google DeepMind, Gemini 3.5 outperforms previous models by 40% on standard STEM evaluation tasks while cutting computational costs in half. The model features custom integrations with search grounding and maps grounding, enabling it to reference real-world locations and active web articles with zero delay.\n\nDevelopers can test the model starting today via Google AI Studio. Enterprise clients can deploy Gemini 3.5 on Vertex AI to power advanced logistics, automated coding assistants, and interactive client relations.",
    bullets: [
      "Gemini 3.5 exhibits a 40% benchmark improvement in complex STEM and coding reasoning.",
      "Features optimized sub-second speech synthesis and vision capabilities natively.",
      "Fully integrated with real-time Google Search grounding tools for zero-latency queries."
    ],
    time: "2 hours ago",
    category: "tech",
    featured: false,
    url: "https://techcrunch.com"
  },
  {
    id: "james-webb-habitable",
    title: "James Webb Telescope Discovers Atmospheric Signatures on Habitable Zone Planet",
    source: "NASA Space Portal",
    sourceIconUrl: "",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop",
    summary: "Astronomers locate carbon dioxide, water vapor, and methane in the atmosphere of exoplanet LHS-1140b using JWST's transmission spectroscopy.",
    content: "In what is being hailed as a historic milestone for astrobiology, an international team of astronomers using the James Webb Space Telescope (JWST) has detected compelling atmospheric signatures on the temperate exoplanet LHS-1140b, located approximately 50 light-years from Earth. Operating in the habitable zone of its host star, the planet shows clear transmission spectra indicating carbon dioxide, methane, and liquid water vapor.\n\nLHS-1140b is a 'super-Earth' planet, roughly 1.7 times the radius of Earth. Previous radial velocity measurements suggested it might possess a global ocean. This JWST data represents the first time scientists have successfully identified key molecules essential for life on a planet of this size outside our solar system.\n\nWhile scientists caution that the presence of these gases does not definitively confirm alien biology, it proves that LHS-1140b possesses a rich, protective atmosphere that could sustain temperate surface conditions. Further observation cycles are planned to look for biological marker gases like dimethyl sulfide.",
    bullets: [
      "JWST detects carbon dioxide, water vapor, and methane on temperate exoplanet LHS-1140b.",
      "Exoplanet lies within the habitable zone where liquid surface water could plausibly exist.",
      "The discovery marks a monumental breakthrough in transmission spectroscopy of temperate worlds."
    ],
    time: "1 day ago",
    category: "science",
    featured: false,
    url: "https://nasa.gov"
  },
  {
    id: "climate-neutrality-2026",
    title: "Global Climate Summit 2026 Ends with Binding Carbon Reduction Milestones",
    source: "BBC News",
    sourceIconUrl: "",
    imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop",
    summary: "Over 140 nations sign the historic Paris Accord Expansion, committing to phase out thermal coal entirely by 2035 with financial support grids.",
    content: "The UN Climate Change Conference (COP31) wrapped up in Geneva with a landmark treaty dubbed the 'Geneva Climate Pact.' Under the treaty, major industrial nations have committed to a legally binding framework to phase out thermal coal operations by 2035 and double funding for climate adaptation in developing economies.\n\nThe pact also outlines ambitious targets for carbon capture technologies and establishes global carbon tax minimums to prevent trade leakages. Critics have raised concerns over the lack of instant enforcement bodies, but lead negotiators call it the most ambitious agreement since the 2015 Paris Accord.\n\nSubstantial capital pledges were made by development banks to construct green solar and wind arrays across North Africa and Southeast Asia. The initiative seeks to transition coal-dependent local economies to clean-tech manufacturing hubs.",
    bullets: [
      "COP31 concludes with over 140 countries agreeing to end coal-fired power by 2035.",
      "Green adaptation funding for developing economies raised to a record $200 billion annually.",
      "Pact introduces international minimum carbon pricing rules starting next fiscal year."
    ],
    time: "10 hours ago",
    category: "world",
    featured: false,
    url: "https://www.bbc.co.uk/news"
  },
  {
    id: "mrna-allergy-reversal",
    title: "New Single-Dose mRNA Therapy Shows 95% Success in Reversing Severe Peanut Allergies",
    source: "The Lancet Health",
    sourceIconUrl: "",
    imageUrl: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?w=800&auto=format&fit=crop",
    summary: "A revolutionary clinical trial successfully desensitizes severe allergy patients by reprogramming IgE antibody responses in a single dose.",
    content: "Researchers have announced breakthrough results from a Phase II clinical trial of an investigational mRNA therapeutic, codenamed Alergen-12. In a cohort of 400 pediatric and adult subjects with life-threatening peanut allergies, a single intramuscular injection led to a 95% complete desensitization within twelve weeks, enabling them to consume peanuts safely.\n\nUnlike traditional immunotherapy, which requires months of escalating allergen exposure, Alergen-12 uses lipid-nanoparticle mRNA to reprogram B-lymphocytes, halting the production of allergen-specific IgE antibodies and replacing them with neutral IgG4 protectors. The therapy effectively 'mutes' the body's allergic response before it triggers anaphylaxis.\n\nNo serious adverse events were recorded during the trials. Regulatory filings for accelerated approval are already underway, offering hope to millions of families living in fear of accidental exposure. Scientists hope to adapt the platform next to treat severe wheat, soy, and shellfish allergies.",
    bullets: [
      "Phase II clinical trial shows 95% peanut allergy reversal within three months of single injection.",
      "mRNA therapy safely reprograms IgE antibodies to prevent inflammatory anaphylaxis.",
      "FDA accelerated review requested; research underway for soy, milk, and shellfish allergies."
    ],
    time: "3 days ago",
    category: "health",
    featured: false,
    url: "https://thelancet.com"
  }
];

// Helper to filter/arrange seed articles for a given category
function getSeedArticlesByCategory(category: string, search?: string): any[] {
  let list = [...SEED_ARTICLES];
  
  if (category && category !== "home" && category !== "foryou" && category !== "following") {
    list = list.filter(a => a.category === category);
  }
  
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(a => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q));
  }
  
  return list;
}

// ----------------------------------------------------
// API ENDPOINTS
// ----------------------------------------------------

// 1. Fetch News Feed (Dynamic via Gemini or Seed Fallback)
app.post("/api/news/feed", async (req, res) => {
  const { category = "home", searchQuery = "", interests = [] } = req.body;
  
  console.log(`Feed requested for: category='${category}', search='${searchQuery}', interests=[${interests.join(', ')}]`);

  // Fallback if Gemini client is unavailable
  if (!ai) {
    let result = getSeedArticlesByCategory(category, searchQuery);
    
    // For "Following", filter based on interest terms
    if (category === "following" && interests.length > 0) {
      result = SEED_ARTICLES.filter(a => 
        interests.some((interest: string) => 
          a.title.toLowerCase().includes(interest.toLowerCase()) || 
          a.summary.toLowerCase().includes(interest.toLowerCase()) ||
          a.category.toLowerCase().includes(interest.toLowerCase())
        )
      );
    }
    
    const personalizedBriefing = category === "foryou" 
      ? `## Your Personalized Briefing\nWelcome back! Based on top global developments, **Brazil has punched their ticket into the World Cup last 16** with a breathtaking late winner by Gabriel Martinelli against Japan. In geopolitical circles, the **ASEAN–Türkiye Conference** has concluded with monumental strategic agreements in trade and renewable energy. Finally, science news is buzz with the **James Webb Space Telescope** locating key habitability biosignatures 50 light-years away. Here is your curated briefing for today.`
      : undefined;

    return res.json({
      articles: result,
      personalizedBriefing,
      groundingSources: []
    });
  }

  // Gemini is available!
  try {
    let queryContext = "";
    if (searchQuery) {
      queryContext = `Search query: "${searchQuery}"`;
    } else if (category === "following" && interests.length > 0) {
      queryContext = `Search topics matching interests: "${interests.join(', ')}"`;
    } else {
      queryContext = `Category: "${category}"`;
    }

    const todayDateStr = new Date().toLocaleDateString("en-US", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const prompt = `Current date: ${todayDateStr}.
    Fetch a feed of news articles related to this criteria: ${queryContext}.
    Please query Google Search using Google Search grounding for real-world up-to-date stories.
    
    Generate 5 to 7 highly realistic news articles. Make sure that they contain realistic details, real publisher names, and actual source URLs where possible.
    If the category is "foryou", also generate a personalizedBriefing (3 paragraphs in rich markdown) summarizing the top news of the day.
    
    Make sure to return valid JSON following the schema precisely. No extra text or backticks.`;

    const systemInstruction = `You are an expert news aggregator API modeled after Google News.
Your job is to search the web using Google Search grounding and return a list of high-quality, professional, objective news articles on the requested topic or category.

You MUST return a JSON object containing an array of articles under the key "articles". If the category is "foryou", you should also generate a personalized morning briefing (3 paragraphs of markdown) under the key "personalizedBriefing" summarizing the absolute top global news stories of the day.

Each article object in the "articles" array MUST follow this exact schema:
{
  "id": "string (unique hash)",
  "title": "string (the headline)",
  "source": "string (publisher name, e.g. BBC News, Al Jazeera, TechCrunch, New York Times)",
  "imageUrl": "string (use a highly relevant, beautiful Unsplash image URL e.g. https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800 for news, or search query matching terms like 'technology', 'sports', 'world' etc. to get dynamic imagery)",
  "summary": "string (a concise, objective 1-2 sentence overview of the article)",
  "content": "string (a comprehensive, detailed 3-4 paragraph article body written in professional journalistic style)",
  "bullets": ["string (3 key takeaways)"],
  "time": "string (e.g. '2 hours ago', '5 hours ago', '1 day ago')",
  "category": "string (matching the requested category)",
  "featured": boolean (true if it should be highlighted with a large image card, otherwise false. Make exactly one or two articles featured in the feed),
  "url": "string (the actual web URL from your search grounding or references)"
}

Keep your writing neutral, journalistic, informative, and engaging.
Always ground your answers in real news events using Google Search. Focus on actual developments around the current year (2026) or very recent events.
Ensure the returned string is valid JSON and nothing else.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "{}";
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(text);
    } catch (parseErr) {
      console.error("JSON parsing failed, raw response:", text);
      // Clean up markdown formatting if returned mistakenly
      const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedData = JSON.parse(cleanText);
    }

    // Extract search grounding sources to provide authentic validation
    const groundingSources: any[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      for (const chunk of chunks) {
        if (chunk.web) {
          groundingSources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      }
    }

    res.json({
      articles: parsedData.articles || [],
      personalizedBriefing: parsedData.personalizedBriefing,
      groundingSources
    });

  } catch (error: any) {
    console.error("Error generating dynamic feed:", error);
    // Graceful fallback to pre-curated
    let result = getSeedArticlesByCategory(category, searchQuery);
    res.json({
      articles: result,
      error: "Temporary issue connecting to the live news wire. Serving pre-curated news briefings.",
      groundingSources: []
    });
  }
});

// 2. Translate Article Content using Gemini
app.post("/api/news/translate", async (req, res) => {
  const { title, content, targetLanguage = "Spanish" } = req.body;
  
  if (!ai) {
    return res.json({
      translatedTitle: `[Translated to ${targetLanguage}] ` + title,
      translatedContent: `[Self-translated fallback because no Gemini API key is configured]\n\n` + content
    });
  }

  try {
    const prompt = `Translate the following news headline and body text into ${targetLanguage} accurately and professionally, preserving journalistic tone.
    
    Headline: "${title}"
    
    Body Text:
    "${content}"
    
    Return a JSON object containing exactly "translatedTitle" and "translatedContent" keys, and nothing else.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            translatedTitle: { type: "STRING" },
            translatedContent: { type: "STRING" }
          },
          required: ["translatedTitle", "translatedContent"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error) {
    console.error("Error translating content:", error);
    res.status(500).json({ error: "Translation failed" });
  }
});

// 3. Text to Speech using Gemini TTS
app.post("/api/news/tts", async (req, res) => {
  const { text } = req.body;
  
  if (!ai) {
    return res.status(400).json({ error: "Gemini API key is required for server-side TTS." });
  }

  try {
    // Generate speech using gemini-3.1-flash-tts-preview
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Read this news briefing summary warmly and clearly: ${text}` }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Warm, clear prebuilt voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audio: base64Audio });
    } else {
      res.status(500).json({ error: "No audio generated in model response" });
    }
  } catch (error: any) {
    console.error("Error generating TTS audio:", error);
    res.status(500).json({ error: "Speech generation failed: " + error.message });
  }
});

// ----------------------------------------------------
// SERVER MIDDLEWARE SETUP
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Connect Vite development server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite development middleware.");
  } else {
    // Connect static distribution folder in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving static production assets from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI News Briefing full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
