import "../styles/FeaturePage.css";

export type FilterTopicId = "lifestyle" | "interests" | "location" | "shared-values";

interface FilterTopicPageProps {
  topic: FilterTopicId;
  onNavigate: (page: string) => void;
  onBack: () => void;
  token?: string | null;
}

interface TopicContent {
  icon: string;
  title: string;
  subtitle: string;
  intro: string;
  sections: { heading: string; text: string }[];
  primaryCta: { label: string; page: string };
}

const topics: Record<FilterTopicId, TopicContent> = {
  lifestyle: {
    icon: "🌿",
    title: "Lifestyle",
    subtitle: "Find people who fit how you actually live.",
    intro:
      "Lifestyle compatibility — habits like smoking, drinking, fitness, and pace of life — quietly decides whether a relationship feels easy or constant negotiation. Filter for what matches yours.",
    sections: [
      {
        heading: "Smoking & drinking",
        text: "Choose Non-smoker / Smoker / Any, and Doesn't drink / Drinks / Any. Profiles outside your selection are hidden from results.",
      },
      {
        heading: "Body type & fitness",
        text: "Body type filter (Slim / Average / Athletic) plus fitness as an interest chip surface people whose physical lifestyle aligns with yours.",
      },
      {
        heading: "Daily rhythm",
        text: "Combined with the Activity signal (online now / recently active), lifestyle filters help you meet people whose day-to-day feels compatible with yours.",
      },
    ],
    primaryCta: { label: "Open Advanced Filtering", page: "advanced-filtering" },
  },
  interests: {
    icon: "🎯",
    title: "Interests",
    subtitle: "Match on the hobbies that actually matter to you.",
    intro:
      "Shared interests are the easiest first conversation — and the strongest signal that you'll have things to do together once the dating part settles.",
    sections: [
      {
        heading: "Multi-select chips",
        text: "Pick any combination from Hiking, Coffee, Travel, Music, Movies, Books, Foodie, Fitness, Art, Pets. Profiles matching ANY of your selections appear.",
      },
      {
        heading: "Boost on overlap",
        text: "On the Better Matches page, the more interests overlap, the higher the compatibility score (up to +15 points). Filtering and ranking work together.",
      },
      {
        heading: "Easy to widen",
        text: "If results feel too narrow, just deselect chips. The page recalculates instantly — no Apply button needed.",
      },
    ],
    primaryCta: { label: "Open Advanced Filtering", page: "advanced-filtering" },
  },
  location: {
    icon: "📍",
    title: "Location",
    subtitle: "Focus on people you can actually meet.",
    intro:
      "A great match three time zones away is still a long-distance relationship. Location filtering keeps your matches realistic.",
    sections: [
      {
        heading: "City / area search",
        text: "Type any part of a city or area name. Matching profiles include cities like Brooklyn, Austin, Toronto, London, Berlin, Vancouver — partial matches work.",
      },
      {
        heading: "Distance preference",
        text: "On Smart Discovery, the distance slider (1–500 km) caps how far results can be from you. Use it together with the city filter for fine-grained control.",
      },
      {
        heading: "Travel-friendly",
        text: "Going somewhere new? Update your location on Profile to discover people there before you arrive.",
      },
    ],
    primaryCta: { label: "Open Advanced Filtering", page: "advanced-filtering" },
  },
  "shared-values": {
    icon: "🤝",
    title: "Shared values",
    subtitle: "Filter for people looking for the same kind of relationship.",
    intro:
      "Looking-for, education, and other values matter more than chemistry on date one. These filters keep the matches aligned on the things that actually predict whether things last.",
    sections: [
      {
        heading: "Looking for",
        text: "Pick Long-term, Open to anything, or any. People whose intent doesn't match yours are hidden — saves the awkward third-date conversation.",
      },
      {
        heading: "Education",
        text: "Filter by Bachelor's / Master's / Doctorate / Trade school / Culinary school / Any. Useful when this is something that matters to you, optional when it isn't.",
      },
      {
        heading: "Compatibility, not gatekeeping",
        text: "Values filters narrow results — they don't rank people. Two people with different educations can still be a great match if you keep them as Any.",
      },
    ],
    primaryCta: { label: "Open Advanced Filtering", page: "advanced-filtering" },
  },
};

const otherIds: Record<FilterTopicId, FilterTopicId[]> = {
  lifestyle: ["interests", "location", "shared-values"],
  interests: ["lifestyle", "location", "shared-values"],
  location: ["lifestyle", "interests", "shared-values"],
  "shared-values": ["lifestyle", "interests", "location"],
};

export function FilterTopicPage({ topic, onNavigate, onBack, token }: FilterTopicPageProps) {
  const data = topics[topic];
  const others = otherIds[topic];

  return (
    <div className="feature-page feature-detail-page">
      <button className="feature-back" onClick={onBack}>
        ← Back to Advanced Filtering
      </button>

      <div className="feature-page-hero">
        <h1>
          {data.icon} {data.title}
        </h1>
        <p>{data.subtitle}</p>
      </div>

      <div className="feature-highlight">
        <p>{data.intro}</p>
      </div>

      <div className="feature-section-list">
        {data.sections.map((s) => (
          <div key={s.heading} className="feature-section-card">
            <h2>{s.heading}</h2>
            <p>{s.text}</p>
          </div>
        ))}
      </div>

      <div className="feature-action">
        <h2>Try it now</h2>
        <p>
          {token
            ? `Open Advanced Filtering and apply ${data.title.toLowerCase()} filters to your search.`
            : "Sign in to apply these filters to your search."}
        </p>
        <div className="feature-action-buttons">
          <button
            type="button"
            className="feature-action-btn feature-action-btn-primary"
            onClick={() => onNavigate(token ? data.primaryCta.page : "discover")}
          >
            {data.primaryCta.label} →
          </button>
          <button
            type="button"
            className="feature-action-btn feature-action-btn-secondary"
            onClick={onBack}
          >
            Back to Advanced Filtering
          </button>
        </div>
      </div>

      <div className="feature-related">
        <h2>Other filter dimensions</h2>
        <div className="feature-related-list">
          {others.map((id) => (
            <button
              key={id}
              type="button"
              className="feature-related-card"
              onClick={() => onNavigate(`filter-${id}`)}
            >
              <span className="feature-related-icon">{topics[id].icon}</span>
              <span className="feature-related-title">{topics[id].title}</span>
              <span className="feature-related-arrow">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
