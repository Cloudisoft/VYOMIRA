/** Traditional numerology meanings (Pythagorean/Chaldean share these core associations). */
export interface NumberMeaning { keyword: string; essence: string; personality: string; career: string; love: string; strength: string; challenge: string }

export const MEANING: Record<number, NumberMeaning> = {
  1: { keyword: "The Initiator", essence: "independence, beginnings and self-direction", personality: "You tend to come across as decisive and self-reliant, someone who would rather lead than wait for permission.", career: "Roles with ownership suit you: founding something, leading a team, or carving out an area where your judgement is final.", love: "You value a partner who respects your independence; you show care by taking initiative and protecting what matters.", strength: "Courage to start, clarity about what you want", challenge: "Impatience, and finding it hard to ask for help" },
  2: { keyword: "The Diplomat", essence: "cooperation, sensitivity and partnership", personality: "You tend to read a room quickly and notice what others feel before they say it.", career: "You do well where collaboration matters: mediation, counselling, design, support roles, partnerships and anything needing tact.", love: "Closeness and reassurance matter to you; you give steady attention and expect the same in return.", strength: "Empathy, patience and quiet persuasion", challenge: "Over-accommodating others and avoiding necessary conflict" },
  3: { keyword: "The Communicator", essence: "expression, creativity and joy", personality: "You tend to bring warmth and wit to a conversation and express ideas vividly.", career: "Writing, teaching, media, sales, performance and creative fields reward your ability to make ideas come alive.", love: "You want fun, play and good conversation in a relationship; feeling heard keeps you close.", strength: "Creativity, optimism and communication", challenge: "Scattered energy and leaving projects half-finished" },
  4: { keyword: "The Builder", essence: "structure, discipline and reliability", personality: "You tend to be practical, methodical and trusted to follow through.", career: "Engineering, operations, finance, law, construction and any role built on systems and process fit your steady approach.", love: "You show love through loyalty and dependable action rather than grand gestures.", strength: "Persistence, organisation and integrity", challenge: "Rigidity and resistance to sudden change" },
  5: { keyword: "The Explorer", essence: "freedom, change and experience", personality: "You tend to be curious, adaptable and restless when life gets too predictable.", career: "Travel, marketing, entrepreneurship, journalism and fast-moving work keep you engaged.", love: "You need a relationship with room to breathe and shared adventures.", strength: "Adaptability, resourcefulness and charm", challenge: "Restlessness and difficulty with routine commitments" },
  6: { keyword: "The Nurturer", essence: "responsibility, care and harmony", personality: "You tend to be the person others lean on, with a strong sense of duty to family and community.", career: "Healthcare, teaching, hospitality, design, counselling and service roles draw on your care for others.", love: "Home and family sit at the centre of your life; you give generously and value commitment.", strength: "Compassion, responsibility and an eye for beauty", challenge: "Taking on too much and expecting perfection" },
  7: { keyword: "The Seeker", essence: "analysis, introspection and wisdom", personality: "You tend to be thoughtful and private, needing time alone to make sense of things.", career: "Research, technology, analysis, spiritual or scientific study suit your depth of thought.", love: "You open up slowly; trust and intellectual connection matter more than speed.", strength: "Insight, focus and independent thinking", challenge: "Withdrawal and over-thinking" },
  8: { keyword: "The Executive", essence: "ambition, authority and material mastery", personality: "You tend to be goal-oriented and comfortable with responsibility and decisions involving resources.", career: "Management, business, finance, law and leadership roles reward your strategic drive.", love: "You are protective and generous; balancing work with tenderness is your growth point.", strength: "Strategic thinking, resilience and leadership", challenge: "Workaholism and measuring worth by results" },
  9: { keyword: "The Humanitarian", essence: "compassion, completion and idealism", personality: "You tend to be broad-minded and moved by causes larger than yourself.", career: "Social impact, arts, teaching, healing and international work fit your wide view.", love: "You love generously and idealistically; letting go of the past gracefully is part of your path.", strength: "Generosity, wisdom and tolerance", challenge: "Difficulty with endings and self-sacrifice" },
  11: { keyword: "The Intuitive (master 11)", essence: "inspiration, intuition and heightened sensitivity", personality: "You tend to sense undercurrents others miss, with an inspiring, sometimes intense presence.", career: "Teaching, counselling, the arts and visionary roles give your intuition a purpose.", love: "You seek deep, almost spiritual connection and are sensitive to discord.", strength: "Intuition, inspiration and idealism", challenge: "Nervous tension and self-doubt" },
  22: { keyword: "The Master Builder (master 22)", essence: "turning large visions into practical reality", personality: "You tend to combine big-picture vision with the patience to build it step by step.", career: "Large-scale projects, architecture, institutions and enterprises suit your capacity to build.", love: "You are steady and committed, sharing long-term plans with a partner.", strength: "Vision with discipline", challenge: "Pressure from very high expectations" },
  33: { keyword: "The Master Teacher (master 33)", essence: "compassionate service and guidance", personality: "You tend to feel responsible for uplifting others, often through example.", career: "Teaching, healing, mentoring and creative service bring out your gifts.", love: "You love devotedly and protectively; remember your own needs too.", strength: "Compassion, guidance and creativity", challenge: "Self-sacrifice and carrying others' burdens" },
};

export const meaning = (n: number) => MEANING[n] ?? MEANING[((n - 1) % 9) + 1];

export const PERSONAL_YEAR: Record<number, string> = {
  1: "a year of new beginnings — start things, set direction, act on ideas you have been holding back",
  2: "a year of patience and partnership — relationships, cooperation and quiet progress matter more than speed",
  3: "a year of expression — communicate, create, socialise and let yourself be seen",
  4: "a year of foundations — steady work, health routines, finances and structure pay off",
  5: "a year of change — movement, new experiences and adapting to the unexpected",
  6: "a year of responsibility — home, family, commitments and care for others come forward",
  7: "a year of reflection — study, inner work and rest; fewer but deeper commitments",
  8: "a year of results — career, money and recognition, earned through effort and good decisions",
  9: "a year of completion — finish cycles, release what no longer fits and prepare for a fresh start",
};

export const LO_SHU_MISSING: Record<number, string> = {
  1: "self-expression and confidence in speaking up may need conscious practice",
  2: "patience and sensitivity to others may need conscious attention",
  3: "imagination and verbal expression may benefit from regular creative outlets",
  4: "organisation and routine may not come naturally — simple systems help",
  5: "balance and emotional steadiness benefit from grounding habits",
  6: "home, responsibility and creative care may need deliberate effort",
  7: "learning from setbacks and reflection may need space and patience",
  8: "attention to detail and handling money methodically are areas to build",
  9: "idealism and broad ambition may need nurturing",
};

export const LO_SHU_ARROW: Record<string, string> = {
  mental: "Mental plane (4-9-2): strong thinking and planning",
  emotional: "Emotional plane (3-5-7): emotional balance and sensitivity",
  practical: "Practical plane (8-1-6): hands-on, material capability",
  thought: "Thought plane (4-3-8): planning and organisation",
  will: "Will plane (9-5-1): determination and persistence",
  action: "Action plane (2-7-6): turning ideas into action",
};
