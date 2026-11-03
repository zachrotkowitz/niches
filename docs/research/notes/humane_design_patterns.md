# Humane Design Patterns for "Niches": evidence base, patterns to adopt, dark patterns to avoid, and core-screen UI conventions

Research date: 2026-11-03. Scope: phone-first Gen Z social app with separate, user-toggled niche feeds (Cooking, Art, Photography, Gym), newest-first chronological feeds, hidden like counts, photo/text/video posts, Pinterest-style saved collections, progress posts and goals.

Method note: About 27 search/fetch calls. Most findings come from search-result summaries of primary pages (company newsrooms, papers, regulations) and reputable press. Direct fetches of m3.material.io and csmapnyu.org failed: those hosts are outside this session's allowed network domains and would need to be allowed in the session's network settings. The Apple HIG fetch returned only the page title (the page renders client-side). Material Design and Apple HIG specifics are therefore thin, and are flagged as gaps.

---

## 1. Hidden like counts: Instagram/Facebook experiments (2019–2021), well-being research, and what Instagram shipped

### Takeaway
Instagram tested hidden like counts from 2019 to 2021 and found no measurable change in overall well-being, while user opinion split sharply. On May 26, 2021 it shipped an opt-in toggle with likes visible by default, not hidden-by-default. Independent research is thin but points the same way: hiding counts lowers some posting pressure and comparison, and it is not a well-being cure. For Niches, hidden-by-default (counts private to the poster) is defensible and unusual. It differentiates the app, but it should not be marketed as clinically proven.

### Cited Findings
- Instagram began hiding like counts for a small test group in 2019 (it started in Canada) "to test whether it eased posting pressure". Posters could still see their own counts. — [TechCrunch, Apr 30 2019](https://techcrunch.com/2019/04/30/instagram-hidden-like-counter/); [ScienceAlert](https://www.sciencealert.com/instagram-has-a-trial-to-hide-the-number-of-likes-in-the-hope-that-it-saves-self-esteem)
- Facebook ran its own hidden-like test from September 2019. — [SpeedGuide, Sep 3 2019](https://www.speedguide.net/news/facebook-plans-to-hide-like-counts-in-new-test-7040)
- Internally this was "Project Daisy" (announced Nov 2019): like counts were hidden from viewers while creators could still see their own. — [Shorenstein Center case study](https://shorensteincenter.org/case-study-online-youth-harms-project-daisy/); [discussion paper PDF, Nov 2023](https://shorensteincenter.org/wp-content/uploads/2023/11/Discussion-Paper_Youth-Online-Harms-and-Project-Daisy_For-Shorenstein-Publication.pdf)
- **The evidence on Daisy's well-being effects is mixed or conflicting.** The Shorenstein case study says Daisy "reduced commercial metrics related to revenues, ads and user engagement" but also "reduced the importance of likes for teens and had positive effects on their well-being". An internal slide quoted in WSJ-derived coverage instead says: "We didn't observe movements in overall well-being measures." — [Shorenstein](https://shorensteincenter.org/case-study-online-youth-harms-project-daisy/); [The Wire on Facebook internal research](https://thewire.in/tech/facebook-internal-research-hiding-likes-better-for-users-social-comparison)
- According to Shorenstein, the decision to launch on Instagram and drop it on Facebook was "partly influenced by positive feedback from policy makers, press, and academics". An internal note framed the launch as showing "Instagram cares about its users". — [Shorenstein](https://shorensteincenter.org/case-study-online-youth-harms-project-daisy/)
- In March 2021 a bug hid counts for many more users. Mosseri called the idea "very polarizing". — [Hootsuite blog](https://blog.hootsuite.com/social-media-updates/instagram/instagram-continues-testing-option-to-turn-off-like-counts/); [Social Media Today](https://www.socialmediatoday.com/news/instagram-says-that-its-exploring-options-that-would-enable-users-to-hide/596253)
- **What shipped (May 26, 2021):** everyone on Instagram and Facebook can choose to hide like counts on all posts in their feed and/or on their own posts, via the Posts section in Settings. **The default stayed "likes visible."** Mosseri said Instagram would "explore" hiding counts by default for under-18s. The setting is separate per app, so you can see counts on Facebook but not on Instagram. — [Good Morning America/ABC](https://www.goodmorningamerica.com/news/story/instagram-users-option-hide-likes-77899569); [Peninsula Qatar, May 26 2021](https://thepeninsulaqatar.com/article/26/05/2021/Facebook-and-Instagram-will-let-users-hide-likes-on-posts); [Hypebeast](https://hypebeast.com/2021/5/instagram-option-hide-public-like-counts)
- Stated reasons for shipping a choice rather than a default: some people found hiding counts beneficial, while others were annoyed to lose the metric (creators and businesses used it to gauge trends). Mosseri said that without counts some people shared more, while for others engagement dropped slightly. Reporting said the tests showed no particular change in psychological well-being but polarized opinion. — [Peninsula Qatar](https://thepeninsulaqatar.com/article/26/05/2021/Facebook-and-Instagram-will-let-users-hide-likes-on-posts); [Yahoo/AP](https://news.yahoo.com/not-facebook-instagram-let-users-130102199.html)
- Independent study by Elaine Wallace (NUI Galway): 280 US Instagram users, scenario-based, measuring negative affect and loneliness. She concluded there is "little evidence" that showing likes to followers improves well-being, and suggested that competing on visible like counts may make people unhappy. Only press coverage was found; venue and full methods were not verified. — [Irish Tech News](https://irishtechnews.ie/study-finds-instagram-likes-make-you-less-lonely/)
- Adolescent neuroscience context, from a press summary of the earlier UCLA work (Sherman et al., 2016): adolescents viewing photos with more likes showed more activity in reward, social-cognition and imitation regions. Teens considered roughly 30–90 likes the threshold for a "popular" post. — [Sedentary Behaviour Research Network blog, Jul 2019](https://www.sedentarybehaviour.org/2019/07/24/instagrams-hidden-likes-youth-mental-health/)
- Expert caveat at the time: hiding counts doesn't address other comparison harms such as bullying and FOMO, and "people are very driven by rewards so they're still going to be competing." — [Big Think](https://bigthink.com/the-present/instagram-likes/); [ScienceAlert](https://www.sciencealert.com/instagram-has-a-trial-to-hide-the-number-of-likes-in-the-hope-that-it-saves-self-esteem)

### Inferences
- Instagram's choice not to default-hide is best explained by commercial and creator pressure (Daisy reduced ad and engagement metrics) and polarized preference, not by evidence that visible counts are harmless.
- For Niches, the "Project Daisy" model fits: public counts hidden, the poster sees their own count privately. A further step would be to show the poster qualitative feedback ("12 people saved this to collections", or names of who liked) instead of a big number. This is an inference. No study specifically tests count-free qualitative feedback.
- Niches should avoid any ranking surface (e.g., "Top posts this week") that reintroduces visible popularity, since that defeats the hidden-count design.

### Gaps
- No peer-reviewed randomized trial of hidden likes on a live platform with published well-being outcomes was found. Meta's internal data was never released in full.
- The full text of the Wallace study was not retrieved.
- It was not verified whether Instagram ever made hidden-by-default the rule for teen accounts. Teen Accounts (2024) material found in this session doesn't mention like counts.

---

## 2. Chronological vs. algorithmic feeds: 2023 Meta election studies, Instagram Following/Favorites (2022), Bluesky custom feeds

### Takeaway
The strongest causal evidence comes from Guess et al., *Science* 381:398–404 (July 2023; 2020 US election, roughly 40k consenting users). Switching to a reverse-chronological feed substantially reduced time spent and activity: about 20% on Facebook and 11% on Instagram, per the co-author's summary. Over three months it produced no detectable change in political attitudes, knowledge or offline behavior. Platforms read this as "people prefer ranked feeds." A humane app can read it as "chronological feeds don't hook people as hard." Either way, chronological plus finite is a deliberate engagement trade-off. Instagram (2022) and Bluesky (2023) both settled on chronological as a user-selectable view with ranked or custom feeds alongside it, not as the only option.

### Cited Findings
- Guess et al. (2023), "How do social media feed algorithms affect attitudes and behavior in an election campaign?", *Science* vol. 381, pp. 398–404. A sample of consenting users was assigned to reverse-chronological feeds instead of the default algorithms. "Moving users out of algorithmic feeds substantially decreased the time they spent on the platforms and their activity." It "did not cause detectable changes in downstream political attitudes, knowledge, or offline behavior" over the roughly three-month study. — [CSMaP NYU research page](https://csmapnyu.org/research/how-do-social-media-feed-algorithms-affect-attitudes-and-behavior-in-an-election-campaign); [Princeton CSDP](https://csdp.princeton.edu/news/andy-guess-publishes-article-social-media-and-2020-election); [Network Science Institute listing](https://www.networkscienceinstitute.org/publications/how-do-social-media-feed-algorithms-affect-attitudes-and-behavior-in-an-election-campaign)
- Magnitude: per a summary of co-author Andy Guess's thread, time spent fell about 20% on Facebook and about 11% on Instagram. A news write-up claimed users spent "around half" the time. **These conflict.** Prefer the author-sourced figures. Roughly 40,000 volunteers were recruited via in-feed invitations. — [search summary of author thread and news coverage, via plawiuk.blogspot (aggregating news)](https://plawiuk.blogspot.com/2023/07/facebooks-algorithm-doesnt-alter.html); [CSMaP](https://csmapnyu.org/research/how-do-social-media-feed-algorithms-affect-attitudes-and-behavior-in-an-election-campaign)
- Critique: a later commentary argues that Meta changed its feed ranking during the study window, which altered the control condition and may affect the conclusions. — [arXiv 2409.18393](https://www.arxiv.org/pdf/2409.18393)
- Instagram's chronological feed: Mosseri flagged its return in his Dec 2021 congressional testimony and confirmed it on Jan 5, 2022, with tests of three views (Home ranked, Following, Favorites). Both chronological views launched **March 23, 2022**. Favorites holds up to 50 accounts, shown chronologically and also boosted in Home. **Neither is the default.** Instagram said: "We know from research that people have a better experience on Instagram with a ranked feed." Chronological had been the default until 2016. — [MacRumors, Mar 23 2022](https://macrumors.com/2022/03/23/instagram-chronological-feed-option); [PetaPixel](https://petapixel.com/2022/03/23/instagrams-chronological-feed-is-finally-back/); [Digital Trends](https://digitaltrends.com/mobile/instagram-chronological-feed-returning-this-year-mosseri); [MobileSyrup, Jan 6 2022](https://mobilesyrup.com/2022/01/06/instagram-now-testing-chronological-feeds/)
- Bluesky launched custom feeds in May 2023 ("My Feeds"). Users pin alternative feeds, which "appear as separate tabs at the top of their timeline". The app still defaults to a chronological Following timeline, and most custom feeds are built by independent developers. Bluesky frames this as "algorithmic choice": unpin feeds you don't like, and discover and install new ones. — [Bluesky blog, Jul 27 2023](https://bsky.social/about/blog/7-27-2023-custom-feeds); [Bluesky blog, Mar 30 2023 "Algorithmic choice"](https://bsky.social/about/blog/3-30-2023-algorithmic-choice); [9to5Mac, May 26 2023](https://9to5mac.com/2023/05/26/bluesky-feeds-custom-algorithms/); [Engadget](https://www.engadget.com/bluesky-now-lets-you-choose-your-own-algorithm-183824105.html)
- **EU DSA Article 38:** very large online platforms (VLOPs) and very large online search engines (VLOSEs) that use recommender systems must provide, for each recommender system, at least one option "not based on profiling" (GDPR Art. 4(4)). This is in addition to the Art. 27 transparency duties (explaining main parameters and how users can modify them). Recital 94 says the choice should be directly accessible from the interface where recommendations appear. — [DSA Art. 38 text, Springlex (OJ L 277, 27/10/2022)](https://www.springlex.eu/en/packages/dsa/dsa-regulation/article-38/); [Prighter DSA Art. 38](https://prighter.com/resources/laws/dsa/articles/article-38)
- An April 2025 civil-society complaint (GFF) alleges that Meta's non-profiling option breaches Art. 38, read with Art. 27(3) and the Art. 25 dark-patterns ban (for example, by not persisting the user's choice). This is an allegation, not a ruling. — [GFF complaint PDF](https://freiheitsrechte.org/uploads/documents/Freiheit-im-digitalen-Zeitalter/Center-for-User-Rights/20250414-meta-complaint_redacted.pdf)

### Inferences
- Niches's design (chronological, per-niche feeds the user toggles) maps closely onto Bluesky's pinned-feed tabs and Instagram's Following view. It already satisfies the spirit of DSA Art. 38. Niches is far from VLOP scale (45M+ EU users), so Art. 38 wouldn't legally apply, but Art. 25 (no dark patterns) and Art. 27 (recommender transparency) apply to all online platforms.
- Expect lower time-on-app than ranked competitors. Guess et al. suggest roughly 10–20% less. Product metrics should therefore centre on satisfaction, return visits and saves, not minutes.
- Give the chronological choice persistence: remember the user's choice rather than silently resetting to a ranked view. That reset is the behaviour the GFF complaint objects to.
- Chronological feeds favour high-frequency posters. Consider light mitigations such as collapsing bursts ("Maya posted 6 photos") so one prolific account doesn't flood a niche. This is an inference; no source covers it.

### Gaps
- Exact sample sizes per platform and the content-exposure findings of Guess et al. (e.g., chronological feeds raising exposure to political and "untrustworthy" content on Facebook while reducing uncivil content) are recalled from the paper's abstract. They could not be verified this session because the CSMaP fetch was blocked. Verify against the Science DOI (10.1126/science.abp9364) before citing.
- No reliable source was found on how much Instagram users actually use the Following/Favorites views.
- No published satisfaction measures from Guess et al. were found. The study measured time and activity, not self-reported satisfaction.

---

## 3. Finite feeds and time-awareness: "You're All Caught Up", Take a Break, daily limits, autoplay off, notification batching

### Takeaway
Stopping cues and batching have reasonable evidence. Notification batching three times a day improved attention, mood and sense of control in a randomized field trial, while turning notifications off entirely raised anxiety and FOMO. Autoplay measurably increases viewing and reduces felt control. Platform "well-being" features are often weakened in practice: Instagram's "caught up" message has more feed below it, and in 2022 Instagram raised the minimum daily limit from 10 to 30 minutes. Niches should make stopping cues real (a true end of feed), not decorative.

### Cited Findings
- **"You're All Caught Up" (Instagram, July 2, 2018):** a message appears once you've seen all new posts from the past two days. Older and already-seen posts continue below it. It was tested from May 2018. Critics noted that heavy followers would rarely reach it. — [Instagram blog](https://about.instagram.com/blog/announcements/introducing-youre-all-caught-up-in-feed); [9to5Mac, Jul 2 2018](https://9to5mac.com/2018/07/02/instagram-youre-all-caught-up-feature/); [Refinery29](https://refinery29.com/2018/07/203405/instagram-feed-most-recent-posts)
- **Take a Break (late 2021):** full-screen reminders after 10, 20 or 30 minutes, user-chosen and opt-in. At launch it was iPhone-only. — [Business Insider India](https://www.businessinsider.in/tech/how-to/how-to-use-instagrams-new-take-a-break-feature-and-have-the-app-remind-you-to-stop-scrolling/articleshow/88215889.cms)
- **Daily limit weakened (Feb 2022):** Instagram removed the 10- and 15-minute daily-limit options and set a 30-minute minimum. It said the aim was to avoid sending multiple notifications at once; critics saw it as a push toward more use. — [MacRumors, Feb 22 2022](https://www.macrumors.com/2022/02/22/instagram-changes-app-daily-use-limits); [9to5Mac, Feb 21 2022](https://9to5mac.com/2022/02/21/instagram-reduces-daily-limit-notification-time-options/); [TechRadar](https://www.techradar.com/news/using-instagrams-time-limit-your-sessions-are-about-to-double-in-length)
- **Instagram Teen Accounts (Sep 17, 2024):** sleep mode is on automatically from 10 PM to 7 AM. Notifications are muted, DMs get auto-replies, and teens see a reminder to close the app. A reminder fires after 60 minutes of daily use, but teens can dismiss it and keep scrolling. Under-16s need a parent's permission to loosen these settings. — [Instagram Teen Accounts page](https://about.instagram.com/community/teen-accounts); [Meta Family Center](https://familycenter.meta.com/instagram-safety/); [Newser](https://www.newser.com/story/356385/instagram-changes-its-rules-for-young-users.html)
- **Notification batching RCT:** Fitz, Kushlev, Jagannathan, Lewis, Paliwal & Ariely (2019), *Computers in Human Behavior* 101:84–94. N=237 Android users in India, 2 weeks, 4 conditions. Batching three times a day (9am, 3pm, 9pm) made participants feel more attentive, productive and in control, and improved mood, versus the control. Hourly batching had few benefits. **No notifications at all brought few benefits but raised anxiety and FOMO.** One summary's wording on productivity conflicts with the others; check the paper. Limits: a short study with self-report diaries. — [Duke Scholars record](https://scholars.duke.edu/publication/1402953); [author PDF](https://static1.squarespace.com/static/57a40c19414fb54f51f8095f/t/614a55faa7b89e25f4e48ad1/1632261627146/2019+Fitz+Batching.pdf); [Springer Nature community summary](https://communities.springernature.com/posts/batching-notifications-can-improve-attention-well-being-and-productivity)
- **Autoplay evidence:**
  - A field experiment (arXiv preprint, Dec 2024) randomly assigned Netflix users to turn autoplay off or keep it on. The authors report a "substantial impact of autoplay on user engagement". — [arXiv 2412.16040](https://arxiv.org/html/2412.16040v1)
  - A UChicago interview study (CSCW 2023) found that autoplay and recommendations made participants feel less in control. Many didn't know autoplay could be disabled, and some said it removed time for reflection. — [UChicago News](https://news.uchicago.edu/story/does-netflix-chill-our-free-will-uchicago-computer-scientists-investigate)
  - A lab study (N=394, *IJHCS* 2024) compared manual play, passive autoplay and "interpassive" autoplay (automatic but user-toggleable). Interpassive gave a greater sense of control than passive autoplay but more inattentiveness than manual play. — [Penn State Pure record](https://pure.psu.edu/en/publications/preventing-users-from-going-down-rabbit-holes-of-extreme-video-co/)

### Inferences
- Niches's chronological, per-niche feeds can have a true finite end: "You're caught up in Cooking. Last new post 3h ago." Older posts would sit behind an explicit tap ("Show older posts"), not auto-load. This is stronger than Instagram's version, where scrolling continues seamlessly.
- Default notifications to a batched digest, for example "3 people commented on your sourdough" delivered at user-chosen times. Fitz et al. suggest about 3 a day beats both real-time and none. Keep real-time an opt-in for direct replies and DMs only.
- Time-awareness tools should be opt-in, set by the user, with low minimums (5–10 minutes). Do not imitate Instagram's 2022 move to a 30-minute minimum.

### Gaps
- No independent evaluation of whether "You're All Caught Up" or Take a Break changed usage was found. Meta has published no outcome data.
- No direct default-off versus default-on autoplay RCT for social feeds was found.

---

## 4. Humane-tech frameworks: Center for Humane Technology / Time Well Spent, Prosocial Design Network, deceptive.design, EU DSA

### Takeaway
These frameworks are useful checklists but differ in rigor. Prosocial Design Network only lists interventions with public experimental evidence. Time Well Spent/CHT is advocacy that influenced industry features (Screen Time, Digital Wellbeing) but publishes little evidence itself. deceptive.design gives the vocabulary of what to avoid. DSA Art. 25 makes dark patterns illegal for online platforms in the EU. The best-documented friction nudge is Twitter's "read before you retweet": users opened articles 40% more often, by Twitter's own figure.

### Cited Findings
- **Time Well Spent / CHT:** Tristan Harris argued that technology should be designed around human needs and values rather than maximizing use. Mark Zuckerberg adopted "time well spent" as a Facebook 2018 goal. The movement is credited with inspiring Apple's Screen Time and Google's Digital Wellbeing, though Wikipedia calls it a "suggested" inspiration and causation is contested. CHT was formalized in 2018 by Harris, Aza Raskin and Randy Fernando. Harris later called Screen Time-style features insufficient because they don't address attention manipulation. — [Wikipedia: Center for Humane Technology](https://en.wikipedia.org/wiki/Center_for_Humane_Technology); [The Next Web, Feb 5 2018](https://thenextweb.com/socialmedia/2018/02/05/tech-group-wants-device-makers-join-fight-technology-addiction/); [Business Insider](https://businessinsider.in/one-of-the-tech-industrys-leading-critics-says-apple-and-googles-new-screen-time-features-will-never-work-because-they-ignore-the-underlying-problem/articleshow/68930008.cms)
- **Prosocial Design Network library:** includes only designs "that have been tested and for which there is public evidence that they are effective in producing prosocial outcomes", usually via statistical or inferential models. Interventions are grouped as proactive, interactive or reactive. Evidence strength varies: source-credibility labels have "promising but limited" evidence, and community notes sharply cut reshares of flagged posts but have limited overall reach. The field is "nascent". — [arXiv 2506.12792, "Prosocial Design in Trust and Safety"](https://arxiv.org/pdf/2506.12792); [Communications Psychology 2023 review](https://link.springer.com/article/10.1038/s44271-023-00052-7)
- **"Read before you retweet" (Twitter, tested June 2020, results Sep 2020):** when users tried to retweet a link they hadn't opened, a prompt suggested reading it first. People opened articles 40% more often after seeing the prompt. The share of people who opened an article before retweeting rose 33%. Some users then chose not to retweet. The prompt didn't block sharing, and it shrinks after first exposure ("we get that you get it"). These are company-reported figures, not independently verified. — [TechCrunch, Sep 24 2020](https://techcrunch.com/2020/09/24/twitter-read-before-retweet/); [Engadget](https://www.engadget.com/twitter-prompt-read-article-before-tweeting-191907421.html); [TechRadar](https://www.techradar.com/news/twitter-prompt-for-making-people-read-articles-before-re-tweeting-is-effective)
- **deceptive.design (Harry Brignull; term coined 2010 with darkpatterns.org):** the current site lists about 16 types. Classics include Confirmshaming ("triggering uncomfortable emotions, such as guilt or shame"), Nagging, Roach Motel/Hard to Cancel, Forced Continuity, Friend Spam, Privacy Zuckering, Disguised Ads, Fake Scarcity, Fake Urgency, Trick Questions, Bait and Switch, Misdirection, Hidden Costs and Sneak into Basket. The academic taxonomy of Gray et al. (2018) uses five categories: Nagging, Obstruction, Sneaking, Interface Interference and Forced Action. — [deceptive.design: Confirmshaming](https://www.deceptive.design/types/confirmshaming); [UW CSE 340 slides](https://courses.cs.washington.edu/courses/cse340/22sp/slides/wk09/Dark-Patterns-Deceptive-Design.pdf); [FH St. Pölten thesis PDF](https://mobile.fhstp.ac.at/wp-content/uploads/2025/01/SOTA_it241502_Versteckte_Beeinflussung.pdf)
- **DSA:** Art. 38 (non-profiling feed option for VLOPs) is covered in section 2. The GFF complaint invokes Art. 25 (the dark-patterns ban for online platforms) alongside Art. 27(3) (recommender choice must be easy to select and modify). — [GFF complaint PDF](https://freiheitsrechte.org/uploads/documents/Freiheit-im-digitalen-Zeitalter/Center-for-User-Rights/20250414-meta-complaint_redacted.pdf); [Springlex Art. 38](https://www.springlex.eu/en/packages/dsa/dsa-regulation/article-38/)

### Inferences: dark patterns most relevant to Niches, and the humane alternative
| Dark pattern | How it shows up in social apps | Niches alternative |
|---|---|---|
| Infinite scroll / no stopping cue | Feed auto-loads forever | True "caught up" end state per niche; older posts behind a tap |
| Autoplay video | Next video plays automatically | Tap-to-play; no auto-advance (see section 7) |
| Variable-reward notifications | "X and 5 others liked…" in real time | Batched digest at user-chosen times |
| Confirmshaming | "No thanks, I don't care about my goals" | Neutral decline copy ("Not now") |
| Nagging | Repeated "turn on notifications" prompts | Ask once, at a moment of clear value; respect "no" |
| Streak loss-aversion pressure | "Your streak will die!" pushes | Forgiving streaks with freezes and no guilt pushes (see section 5) |
| Friend spam / contact harvesting | Upload contacts to "find friends" | Optional, explicit, never auto-messages contacts |
| Roach motel | Hard to delete account or export | One-screen delete and export, including saved collections |
| Visible popularity metrics | Like and follower counts | Hidden public counts; private counts for the poster |
| Algorithm reset | App reverts to ranked feed | Persist the user's niche and feed choices |
- Friction nudges worth adopting, adapted from read-before-share: a gentle prompt before posting a comment the classifier flags as hostile ("Want to rephrase?"), and a reflective prompt on before/after body photos (see section 5). These are inferences adapted from Twitter's prompt and the Prosocial Design Network's approach. The specific prompts are not tested.

### Gaps
- The Prosocial Design Network site (prosocialdesign.org) itself was not fetched. Its per-intervention evidence ratings are not captured here.
- Peer-reviewed effect sizes for Instagram's comment-warning nudge ("Are you sure you want to post this?", 2019) were not found.

---

## 5. Progress and goals without toxic gamification; fitness body-image risk and mitigations

### Takeaway
Streaks drive retention, and Duolingo's own data shows forgiveness mechanics (streak freezes) help retention rather than hurt it. The evidence is almost entirely company-reported. For a Gym niche, the bigger risk is body image: experiments consistently show that fitspiration images raise negative mood and body dissatisfaction versus neutral images, in women and in men. Platform mitigations include Pinterest's 2021 weight-loss ad ban, eating-disorder (ED) search interstitials, and Meta's 2024 hiding of ED content from teens. Privacy controls that let users hide sensitive stats exist (e.g., Strava hides pace, heart rate and calories from others).

### Cited Findings
- **Duolingo streaks** (company-reported): a 7-day streak is associated with a 3.6x higher chance of completing a course (correlational). Allowing users to hold two streak freezes instead of one raised daily active users by 0.38%. A designer's case study claims freezes cut churn by 21% among at-risk users, with no methodology given (treat as unverified). — [Duolingo blog: streak research](https://blog.duolingo.com/duolingo-streak-research/); [Lenny's Newsletter: Behind the product, Duolingo streaks](https://lennysnewsletter.com/p/behind-the-product-duolingo-streaks); [portfolio case study](https://jiwonvyoo.github.io/portfolio/case/duolingo/duo.html)
- Secondhand reports say Duolingo's goal-selection screen improved retention even though the chosen goal wasn't stored, which suggests a commitment or self-signalling effect. These are informal summaries, not a controlled study. — [Lazyweb summary](https://lazyweb.com/research/duolingo-retention-experiments)
- **Strava** (2021 update): users can hide biometric data (calories, heart rate), pace and power from followers and the public while still seeing it themselves. A post-upload "Quick Edit" screen lets users set privacy before the activity is shared. Sources disagree on whether stat-hiding can be a global default or must be set per activity. — [Velo/Outside](https://velo.outsideonline.com/road/road-racing/strava-update-allows-offers-more-privacy-controls-and-more-personalized-data-visualization-features/?scope=anon); [road.cc](https://road.cc/content/tech-news/strava-adds-privacy-features-hiding-data-285549); [Cycling Weekly](https://cyclingweekly.com/news/strava-takes-step-to-address-privacy-concerns-with-quick-edit-introduction)
- **Fitspiration experiments:**
  - Tiggemann & Zaccardo (2015): acute exposure to fitspiration images increased negative mood and body dissatisfaction and decreased appearance self-esteem, compared with travel images. — [Scribd copy, verify against the published version](https://www.scribd.com/document/538593251/tiggemann2015)
  - Prichard, Kavanagh, Mulgrew, Lim & Tiggemann (2020): 108 women aged 17–25 were randomized to fitspiration or travel images. Fitspiration produced significantly higher negative mood and body dissatisfaction, with no difference in subsequent exercise behaviour. — [Burnet Institute listing](https://www.burnet.edu.au/knowledge-and-media/research-articles/the-effect-of-instagram-fitspiration-images-on-young-womens-mood-body-image-and-exercise-behavio); [Flinders University news, Mar 2020](https://news.flinders.edu.au/blog/2020/03/06/women-deflated-by-fitspo-images/)
  - Tiggemann-led study of 300 US men aged 18–30 (2020): men were significantly less satisfied with their bodies after viewing male physique images. — [OrthoAtlanta summary](https://www.orthoatlanta.com/health-news/instagram-influencers-making-guys-more-body-conscious)
- **Pinterest** (announced Jul 2021, effective Jul 1): banned all weight-loss ads, including weight-loss language or imagery and BMI references. Healthy-lifestyle and fitness ads are still allowed if not weight-loss focused. The policy was developed with NEDA. Pinterest already blocked ED-keyword search results and redirected users to expert resources. Critics found leakage: supplement and Noom ads still appeared after the ban. — [CBS News](https://www.cbsnews.com/news/pinterest-bans-weight-loss-diet-ads); [Engadget](https://www.engadget.com/pinterest-weight-loss-ad-ban-130049016.html); [Stylist](https://stylist.co.uk/fitness-health/wellbeing/pinterest-bans-weight-loss-adverts/540873)
- **Meta** (Jan 9, 2024): began hiding content about suicide, self-harm and eating disorders from teens' Instagram and Facebook feeds, even when shared by an account they follow. Meta said such posts can reduce stigma but aren't suitable for all young people. Critics (Fairplay) asked why it took until 2024, and the move came amid lawsuits from US states. — [Fortune, Jan 9 2024](https://fortune.com/2024/01/09/facebook-instagram-hide-posts-suicide-self-harm-eating-disorders-meta-lawsuits-zuckerberg); [KUNC/AP](https://www.kunc.org/news/2024-01-14/meta-to-hide-posts-about-suicide-eating-disorders-from-teens-instagram-and-facebook-feeds)

### Inferences
- **Progress posts:** frame progress as personal and process-based ("week 6 of learning lamination", "first 5k", "10 sketches this month") rather than outcome or appearance-based. Default goal templates in Gym should be performance or habit goals (consistency, lifts, distance), not weight or body-shape goals. Niches could deliberately omit a weight-loss goal type, mirroring Pinterest's ad stance.
- **Streaks:** if streaks are used at all, make them weekly rather than daily (e.g., "3 of 4 weeks"), include freezes or rest days by default (rest days are healthy in fitness), keep them private to the user, and never send loss-aversion notifications ("your streak is about to end!"). Duolingo's data shows forgiveness doesn't cost retention, but its pushy streak notifications are the toxic part to avoid. The weekly-streak design is an inference, not tested.
- **Kudos-style appreciation:** a single lightweight positive reaction ("kudos" or "cheer") with counts hidden fits the hidden-likes model. Avoid leaderboards in Gym, since public ranking amplifies comparison.
- **Before/after photos:** consider a soft-friction interstitial when posting side-by-side body comparisons, with a content label or blur for viewers ("Body progress photo, tap to view"). Add a per-user setting to hide body-transformation content in feeds, and redirect ED-related search terms to resources (the Pinterest/NEDA model). Ban weight-loss product promotion if ads ever exist. These are inferences combining the cited mitigations. No source tested a before/after blur.
- Let users hide sensitive numeric stats (weight, body-fat %, pace) on progress posts, Strava-style, ideally as a default-private setting.

### Gaps
- No peer-reviewed study of streak freezes or Strava kudos effects on well-being was found.
- No platform policy specifically on before/after photos was retrieved, though TikTok and Meta ad policies restrict them in ads. Not verified this session.
- No evidence was found on whether content labels or blur on body-image posts reduce harm.

---

## 6. UI/UX conventions for core screens: feeds, grids, groups, bottom tabs, niche switcher, accessibility

### Takeaway
The conventions are well established. A bottom tab bar holds 3–5 top-level destinations, with navigation only (no actions) and visible labels. Top tabs or segmented controls switch between peer feeds; Bluesky pins custom feeds as swipeable tabs at the top of Home, and Instagram exposes Following/Favorites from the logo menu. Touch targets should be at least 44pt (iOS) or 48dp (Android); the WCAG 2.2 AA floor is 24×24 CSS px. Hidden navigation (hamburger menus) measurably hurts discoverability, per NN/g as reported secondhand. Evidence here is mostly guideline-based rather than experimental.

### Cited Findings
- **Bottom navigation:** reported NN/g findings (179-participant quantitative study) show hidden navigation such as hamburger menus cuts discoverability by about 20% versus visible or combo navigation. **Secondary sources disagree on the exact figures** (another blog cites 21% vs 48% discoverability). Bottom tab bars are recommended as the visible alternative, reachable one-handed and limited to a few items, with "More" for overflow. — [Smart Insights summarizing NN/g](https://www.smartinsights.com/digital-marketing-strategy/are-hamburger-menus-hidden-navigation-good-for-ux/); [UX Planet on one-handed tab bars](https://uxplanet.org/one-handed-use-of-tab-bar-bottom-navigation-best-practices-for-reachability-73376377444b); [uxdesign.cc mobile nav patterns](https://uxdesign.cc/some-common-mobile-nav-patterns-when-to-use-them-9b2bff9fcb0e)
- **Niche-switcher precedent:** Bluesky's pinned feeds appear "as separate tabs at the top of their timeline", the app defaults to the chronological Following tab, and users can reorder or unpin feeds and browse a Discover page for more. Instagram's Following/Favorites are alternate views of the Home feed. — [Bluesky blog, Jul 2023](https://bsky.social/about/blog/7-27-2023-custom-feeds); [9to5Mac](https://9to5mac.com/2023/05/26/bluesky-feeds-custom-algorithms/); [MacRumors](https://macrumors.com/2022/03/23/instagram-chronological-feed-option)
- **Touch targets:**
  - WCAG 2.2 SC 2.5.8 (AA): targets at least 24×24 CSS px, or with a 24px spacing offset.
  - SC 2.5.5 (AAA): 44×44 CSS px.
  - Apple recommends 44×44pt; Google/Material recommends 48×48dp. Designing to 44/48 satisfies AA.
  — [Smashing Magazine, Jul 2024](https://smashingmagazine.com/2024/07/getting-bottom-minimum-wcag-conformant-interactive-element-size/); [W3C Understanding draft](https://raw.githack.com/w3c/wcag/Issue2431-target-size/understanding/22/target-size-minimum.html)

### Inferences (convention-based, from widely known platform patterns; not individually sourced this session)
- **Recommended bottom tab bar (5 items max):** Home (niche feeds) · Search/Discover niches · Create (+) · Saved (collections) · Profile. Note that Apple's HIG discourages using tabs for actions. Instagram and TikTok nonetheless put a centre "+" create button in the tab bar, and users are familiar with it. Alternatively, put Create as a button in the Home header. Notifications can live in the Home header (bell) rather than as a tab, which de-emphasizes them.
- **Niche switcher:** a horizontally scrollable row of pill or chip tabs at the top of Home ("All · Cooking · Art · Photography · Gym · +"), synced with horizontal swipe between feeds. Bluesky, X Lists pinned as tabs, and YouTube/Pinterest topic chips all use this pattern. Provide an "Edit niches" sheet to toggle and reorder, and persist the selection. A segmented control only suits 2–4 fixed options, so chips scale better as users add niches. Each tab gets its own "caught up" end state.
- **Feed card (Instagram style):** single column with a full-width media block, a header (avatar, name, niche tag, relative timestamp, which matters for a chronological feed), actions (appreciate · comment · save to collection · share) and a caption. No public counts.
- **Saved collections (Pinterest style):** a masonry/staggered grid of variable-height tiles for browsing saves and boards, with a two-column grid on phones. Save-to-board is a bottom sheet with recent boards first and "Create board" inline. Masonry suits visual niches (Art, Photography, Cooking) but makes linear reading order ambiguous for screen readers, so set an explicit focus/reading order.
- **Profile:** header (avatar, bio, niches the person posts in as chips, goals/progress summary), then a 3-column square grid (Instagram convention) filterable by niche, plus a Progress tab for goal timelines. Consider hiding follower counts or making them optional, consistent with hidden likes.
- **Groups-like niche hubs (Facebook Groups pattern):** a cover image, description and rules, "Join/Follow niche", then a feed. Pinned rules matter for moderation, especially in Gym (body-image policy).
- **Accessibility basics:**
  - Alt text prompts on image upload, with auto-suggestions the user can edit.
  - Captions for video.
  - Support Dynamic Type / font scaling.
  - Contrast of at least 4.5:1 for text.
  - Don't rely on colour alone (e.g., for the active niche tab).
  - Respect Reduce Motion (no parallax or auto-animating carousels).
  - Label every icon-only button for VoiceOver/TalkBack.
  - Keep targets at least 44pt/48dp.

### Gaps
- Apple HIG (tab bars) and Material 3 (navigation bar) pages could not be read. The Apple page didn't render and m3.material.io is blocked in this session. Exact current guidance (e.g., Material's 3–5 destinations, Apple's tab-bar rules) is from general knowledge and should be verified.
- NN/g primary articles on hamburger menus and tab bars were not fetched, so the discoverability percentages are secondhand and inconsistent.
- No sourced research was retrieved on Pinterest masonry usability, Facebook Groups layout or X Lists tabs. Those inferences are convention-based.
- No usability study comparing chips, segmented controls and swipe for feed switching was found.

---

## 7. Video without the infinite-autoplay trap

### Takeaway
The best evidence (a Netflix field experiment and an HCI lab study) shows autoplay increases consumption and reduces felt control, while user-controllable or manual play preserves agency. For Niches: video as a peer of photos in the same chronological feed, tap to play, no auto-advance to the next video, and no separate vertical full-screen swipe feed.

### Cited Findings
- Randomized autoplay-off versus on (Netflix, preprint Dec 2024): autoplay had a "substantial impact" on engagement. — [arXiv 2412.16040](https://arxiv.org/html/2412.16040v1)
- Autoplay reduces felt control, users often don't know it can be disabled, and they prefer recommendations from people they know. — [UChicago News on the CSCW 2023 study](https://news.uchicago.edu/story/does-netflix-chill-our-free-will-uchicago-computer-scientists-investigate)
- Manual play gave the most attentiveness. User-toggleable ("interpassive") autoplay was preferred and gave more control than passive autoplay (N=394, 2024). — [Penn State Pure](https://pure.psu.edu/en/publications/preventing-users-from-going-down-rabbit-holes-of-extreme-video-co/)
- Instagram's ranked feed is non-default for chronological views, and Meta's engagement incentives favour ranked short video (context from section 2). — [MacRumors](https://macrumors.com/2022/03/23/instagram-chronological-feed-option)

### Inferences (design recommendations; none directly tested for social apps)
- **Tap to play, sound off by default.** At most, show a silent poster frame or a muted 2–3 second preview loop that does not advance. Never auto-advance to another video when one ends: show an end card with "Replay" and "Back to feed".
- **No dedicated vertical swipe-video feed** (the Reels/TikTok model). Videos live inside niche feeds in chronological order and therefore inherit the "caught up" end.
- **Length limits** suited to the content, e.g., 60–180 seconds for posts. Recipes and workout demos often need 1–3 minutes. Optional chapters or step markers for recipe and tutorial videos support purposeful viewing.
- **Required or auto-generated captions,** and a visible scrubber with duration shown before play so users can make an informed choice.
- Treat any autoplay preference as user-set and opt-in (the interpassive model), with a settings toggle that is easy to find.

### Gaps
- No published data from Instagram/Meta or TikTok on autoplay's effect on well-being was found.
- No evidence was found on specific length limits and their effects.
- Whether a chronological feed with tap-to-play video materially changes engagement compared with Reels-style feeds has not been studied publicly.
