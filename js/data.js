/* Path — synthetic catalog. Every organisation, program, person and number here is fake. */
(function () {
  const D = (window.PATH_DATA = {});

  D.FIELDS = ["Computer Science", "Economics", "Biology", "Engineering", "Social Sciences"];
  D.REGIONS = ["Latin America", "Sub-Saharan Africa", "South Asia", "East Asia", "Europe", "North America", "Middle East & N. Africa"];
  D.CITIES = {
    "Latin America": ["Bogotá", "Lima", "São Paulo", "Mexico City", "Santiago"],
    "Sub-Saharan Africa": ["Lagos", "Nairobi", "Accra", "Kigali", "Cape Town"],
    "South Asia": ["Dhaka", "Pune", "Lahore", "Colombo", "Kathmandu"],
    "East Asia": ["Hanoi", "Seoul", "Taipei", "Manila", "Osaka"],
    "Europe": ["Barcelona", "Lyon", "Kraków", "Porto", "Milan"],
    "North America": ["Irvine", "Toronto", "Chicago", "Austin", "Montréal"],
    "Middle East & N. Africa": ["Amman", "Tunis", "Cairo", "Rabat", "Beirut"],
  };
  D.ECON = ["Low income", "Lower-middle", "Middle", "Upper-middle", "High income"];
  D.LEVELS = ["High school", "Undergraduate", "Recent graduate", "Master's student", "Early career"];
  D.STRENGTHS = [
    { k: "research", label: "Research" },
    { k: "coding", label: "Programming" },
    { k: "quant", label: "Quantitative" },
    { k: "writing", label: "Writing" },
    { k: "leadership", label: "Leadership" },
    { k: "entrepreneurship", label: "Entrepreneurship" },
    { k: "communication", label: "Communication" },
    { k: "design", label: "Design & product" },
  ];

  D.TYPES = {
    degree: { label: "Degree", color: "--accent", soft: "--accent-soft", chip: "accent" },
    fellowship: { label: "Fellowship", color: "--amber", soft: "--amber-soft", chip: "amber" },
    internship: { label: "Internship", color: "--teal", soft: "--teal-soft", chip: "teal" },
    research: { label: "Research / advisor", color: "--violet", soft: "--violet-soft", chip: "violet" },
    job: { label: "Position", color: "--sky", soft: "--sky-soft", chip: "sky" },
    milestone: { label: "Milestone", color: "--coral", soft: "--coral-soft", chip: "coral" },
  };

  // cost: 0 = paid / fully funded, 1 = partial cost, 2 = significant tuition
  // stage: column in the graph (1..4), goals live in column 5
  D.NODES = {
    i_sre: { name: "Summer Research Internship", org: "Halden Institute", type: "research", stage: 1, months: 3, cost: 0, abroad: true, funding: "Stipend $6,500", deadline: "2027-01-15", accept: 0.09, req: "1 recommendation letter, research statement", tip: "Email 2–3 PIs whose recent papers you've read before applying.", src: "halden.org/programs", advisor: "Dr. Ines Okafor" },
    i_bigtech: { name: "Software Engineering Internship", org: "Northwind Labs", type: "internship", stage: 1, months: 3, cost: 0, abroad: false, funding: "Paid · $8,200/mo", deadline: "2026-12-01", accept: 0.04, req: "Coding assessment + 2 technical interviews", tip: "Practice 60–80 interview problems; ask an alum for a referral.", src: "careers.northwindlabs.com" },
    f_bridge: { name: "Bridge Scholars Fellowship", org: "Lumen Foundation", type: "fellowship", stage: 1, months: 12, cost: 0, abroad: false, funding: "Full funding + laptop + mentor", deadline: "2027-02-28", accept: 0.12, req: "Household income in bottom 60% of country", tip: "Your financial-need statement matters as much as grades — be concrete.", src: "lumenfoundation.org/bridge", elig: (u) => u.econ <= 3, eligText: "Only for low / middle income students" },
    i_ngo: { name: "Policy Internship", org: "Global Commons Forum", type: "internship", stage: 1, months: 4, cost: 1, abroad: true, funding: "Partial stipend $1,200/mo", deadline: "2027-03-10", accept: 0.15, req: "Writing sample (policy memo), 2 languages", tip: "Submit a 2-page memo on a local policy issue as your writing sample.", src: "globalcommons.org/internships" },
    f_venture: { name: "Founders' Summer Program", org: "Kiln Accelerator", type: "fellowship", stage: 1, months: 3, cost: 0, abroad: false, funding: "$5,000 grant", deadline: "2027-03-31", accept: 0.06, req: "Prototype or traction evidence", tip: "Ship something small with 20 real users before applying.", src: "kiln.vc/summer" },
    i_bio: { name: "Wet-lab Research Assistant", org: "Corvid Bio", type: "research", stage: 1, months: 6, cost: 0, abroad: false, funding: "Paid · $2,400/mo", deadline: "2027-01-31", accept: 0.18, req: "Intro molecular biology coursework", tip: "Highlight any lab techniques you can already run independently.", src: "corvidbio.com/jobs", advisor: "Dr. Tomás Reyes" },

    d_msc_ai: { name: "MSc Machine Learning", org: "University of Aldermoor", type: "degree", stage: 2, months: 18, cost: 2, abroad: true, funding: "Tuition £24k (scholarships 30%)", deadline: "2027-01-20", accept: 0.14, req: "GPA ≥ 3.3, linear algebra, programming", tip: "Apply in round 1; scholarship pools are allocated early.", src: "aldermoor.ac.uk/msc-ml" },
    d_mpp: { name: "Master of Public Policy", org: "Varenna School of Governance", type: "degree", stage: 2, months: 24, cost: 2, abroad: true, funding: "Tuition €18k (need-based aid)", deadline: "2027-02-15", accept: 0.22, req: "GPA ≥ 3.0, statement of purpose", tip: "Frame your statement around one concrete policy problem from your region.", src: "varenna.edu/mpp" },
    d_mph: { name: "MSc Health Data Science", org: "Kessler School of Public Health", type: "degree", stage: 2, months: 12, cost: 2, abroad: true, funding: "Tuition $41k (TA-ships available)", deadline: "2027-01-05", accept: 0.2, req: "Statistics, basic programming", tip: "Ask about TA-ships at interview — they cover ~60% of tuition.", src: "kessler.edu/hds" },
    f_meridian: { name: "Meridian Graduate Fellowship", org: "Meridian Trust", type: "fellowship", stage: 2, months: 12, cost: 0, abroad: true, funding: "Fully funded master's abroad", deadline: "2026-12-15", accept: 0.05, req: "Leadership evidence, 3 references, interview", tip: "Leadership stories beat grades here — prepare 3 STAR examples.", src: "meridiantrust.org/fellows" },
    j_swe: { name: "Software Engineer", org: "Northwind Labs", type: "job", stage: 2, months: 24, cost: 0, abroad: false, funding: "Salary $135k", deadline: "rolling", accept: 0.06, req: "Internship conversion or 3 interview loops", tip: "Ask for a team doing ML infra if you want to move toward research.", src: "careers.northwindlabs.com" },
    j_analyst: { name: "Research Analyst", org: "Pan-Regional Development Bank", type: "job", stage: 2, months: 24, cost: 0, abroad: true, funding: "Salary $62k + relocation", deadline: "2027-04-01", accept: 0.1, req: "Econometrics, Stata/R, writing test", tip: "Replicate one of their published working papers and mention it.", src: "prdb.org/careers" },
    j_startup_eng: { name: "Early Employee (eng/ops)", org: "Seed-stage startup", type: "job", stage: 2, months: 18, cost: 0, abroad: false, funding: "Salary $70k + equity", deadline: "rolling", accept: 0.2, req: "Generalist skills, hustle", tip: "Pick founders over idea; ask about runway in the interview.", src: "jobs.kiln.vc" },

    d_phd_ml: { name: "PhD in Machine Learning", org: "Lab of Prof. Hana Lindqvist", type: "research", stage: 3, months: 60, cost: 0, abroad: true, funding: "Fully funded + stipend $38k", deadline: "2026-12-10", accept: 0.04, req: "Research experience, 3 strong letters", tip: "A first-author workshop paper roughly doubles admit odds in this lab.", src: "lindqvist-lab.org/join", advisor: "Prof. Hana Lindqvist" },
    d_phd_econ: { name: "PhD Development Economics", org: "Lab of Prof. Kwame Asante", type: "research", stage: 3, months: 60, cost: 0, abroad: true, funding: "Fully funded + stipend $36k", deadline: "2026-12-15", accept: 0.06, req: "Real analysis, RA experience", tip: "A 1–2 year RA job before applying is the norm in this field.", src: "asante-devecon.org", advisor: "Prof. Kwame Asante" },
    d_phd_bio: { name: "PhD Computational Biology", org: "Lab of Prof. Mei Tanaka", type: "research", stage: 3, months: 60, cost: 0, abroad: true, funding: "Fully funded + stipend $40k", deadline: "2026-12-01", accept: 0.07, req: "Bio + programming background", tip: "Rotations matter: contact the lab before the interview weekend.", src: "tanakalab.bio/positions", advisor: "Prof. Mei Tanaka" },
    f_aurora: { name: "Aurora AI Residency", org: "Aurora Research", type: "fellowship", stage: 3, months: 12, cost: 0, abroad: true, funding: "Salary $120k, 1 year", deadline: "2027-02-01", accept: 0.03, req: "Open-source or research portfolio", tip: "A reproducible re-implementation of a recent paper is the strongest signal.", src: "aurora.ai/residency" },
    j_pm_assoc: { name: "Associate Product Manager", org: "Northwind Labs", type: "job", stage: 3, months: 24, cost: 0, abroad: false, funding: "Salary $145k", deadline: "2027-01-10", accept: 0.02, req: "Product sense case + leadership examples", tip: "Write 3 public product teardowns; link them in your application.", src: "careers.northwindlabs.com/apm" },
    f_ypp: { name: "Young Professionals Programme", org: "United Policy Council", type: "fellowship", stage: 3, months: 24, cost: 0, abroad: true, funding: "Salary $78k + benefits", deadline: "2027-05-15", accept: 0.02, req: "Master's degree, under 32, 2 UN languages", tip: "The written exam is policy-memo style — practice timed memos.", src: "upc.int/ypp" },
    f_venture2: { name: "Catalyst Venture Fellowship", org: "Catalyst Fund", type: "fellowship", stage: 3, months: 12, cost: 0, abroad: false, funding: "$100k grant, no equity", deadline: "2027-04-20", accept: 0.02, req: "Founding team + traction", tip: "Investors here back teams — find a technical/commercial co-founder first.", src: "catalystfund.org" },
    j_ds: { name: "Data Scientist", org: "Helix Health", type: "job", stage: 3, months: 30, cost: 0, abroad: false, funding: "Salary $118k", deadline: "rolling", accept: 0.08, req: "SQL, Python, causal inference basics", tip: "Bring a portfolio project on public health data (e.g. readmissions).", src: "helixhealth.com/careers" },
    d_mba: { name: "MBA", org: "Corran Business School", type: "degree", stage: 3, months: 24, cost: 2, abroad: true, funding: "Tuition $78k (fellowships 25%)", deadline: "2027-01-08", accept: 0.18, req: "GMAT, 3+ years experience", tip: "Apply in round 1 for fellowship money; GMAT ≥ 700 unlocks most aid.", src: "corran.edu/mba" },

    f_postdoc: { name: "Postdoctoral Fellowship", org: "Ostrander Foundation", type: "fellowship", stage: 4, months: 24, cost: 0, abroad: true, funding: "Salary $68k + research budget", deadline: "2027-10-01", accept: 0.1, req: "PhD + publication record", tip: "Co-write the proposal with your intended host 3 months before deadline.", src: "ostrander.org/postdocs" },
    j_mle: { name: "ML Engineer", org: "Aurora Research", type: "job", stage: 4, months: 24, cost: 0, abroad: true, funding: "Salary $190k", deadline: "rolling", accept: 0.05, req: "Production ML experience", tip: "Internal transfer from residency is the most common route.", src: "aurora.ai/careers" },
    j_policy_officer: { name: "Policy Officer", org: "Global Commons Forum", type: "job", stage: 4, months: 36, cost: 0, abroad: true, funding: "Salary $84k", deadline: "rolling", accept: 0.08, req: "Master's + 3 years experience", tip: "Network through the YPP alumni list.", src: "globalcommons.org/careers" },
    r_seed: { name: "Raise a seed round", org: "Milestone", type: "milestone", stage: 4, months: 18, cost: 1, abroad: false, funding: "Target $1–2M", deadline: "—", accept: 0.15, req: "Product-market-fit signals", tip: "Target 30 angel/seed conversations in 6 weeks; track them like a funnel.", src: "Crunchbase-style aggregated rounds" },
  };

  D.GOALS = [
    { id: "g_rs", name: "ML Research Scientist", org: "Industry research lab", salary: "$210k", aff: { "Computer Science": 3, Engineering: 2, Economics: 0.5, Biology: 0.5, "Social Sciences": 0.2 } },
    { id: "g_prof", name: "Assistant Professor", org: "Research university", salary: "$110k", aff: { "Computer Science": 1, Engineering: 1, Economics: 1.5, Biology: 2, "Social Sciences": 1.5 } },
    { id: "g_policy", name: "Policy Economist", org: "International organisation", salary: "$105k", aff: { "Computer Science": 0.2, Engineering: 0.3, Economics: 3, Biology: 0.3, "Social Sciences": 3 } },
    { id: "g_founder", name: "Startup Founder", org: "Series A company", salary: "equity", aff: { "Computer Science": 1.5, Engineering: 2, Economics: 1, Biology: 0.6, "Social Sciences": 0.6 } },
    { id: "g_pm", name: "Product Manager", org: "Tech company", salary: "$170k", aff: { "Computer Science": 2, Engineering: 1.5, Economics: 1.2, Biology: 0.3, "Social Sciences": 1 } },
    { id: "g_health", name: "Health Data Scientist", org: "Hospital / biotech", salary: "$130k", aff: { "Computer Science": 0.8, Engineering: 0.5, Economics: 0.6, Biology: 3, "Social Sciences": 0.6 } },
  ];

  // Path templates. base = logit at an average profile; w = weights on centred features in [-1,1]
  D.TEMPLATES = [
    { goal: "g_rs", steps: ["i_sre", "d_msc_ai", "d_phd_ml"], base: -0.1, w: { research: 1.8, gpa: 1.4, coding: 0.8, quant: 0.8 } },
    { goal: "g_rs", steps: ["i_bigtech", "j_swe", "f_aurora", "j_mle"], base: -0.5, w: { coding: 2.2, research: 0.9, experience: 0.8 } },
    { goal: "g_rs", steps: ["f_bridge", "d_msc_ai", "f_aurora"], base: -0.3, w: { quant: 1.4, research: 1.0, coding: 0.8, lowIncome: 0.6 } },
    { goal: "g_rs", steps: ["i_sre", "f_meridian", "d_phd_ml"], base: -0.6, w: { gpa: 1.8, writing: 1.0, research: 1.4, leadership: 0.8 } },

    { goal: "g_prof", steps: ["i_sre", "f_meridian", "d_phd_ml", "f_postdoc"], base: -0.9, w: { research: 2.0, gpa: 1.5, writing: 1.2 } },
    { goal: "g_prof", steps: ["i_sre", "d_msc_ai", "d_phd_ml", "f_postdoc"], base: -0.7, w: { research: 2.2, gpa: 1.2, quant: 0.8 } },
    { goal: "g_prof", steps: ["i_ngo", "j_analyst", "d_phd_econ", "f_postdoc"], base: -0.8, w: { research: 1.6, quant: 1.4, writing: 1.0 } },
    { goal: "g_prof", steps: ["i_bio", "d_phd_bio", "f_postdoc"], base: -0.6, w: { research: 2.0, gpa: 1.0, coding: 0.6 } },

    { goal: "g_policy", steps: ["i_ngo", "d_mpp", "f_ypp"], base: -0.2, w: { writing: 1.6, communication: 1.0, languages: 1.0, econ: 0.4 } },
    { goal: "g_policy", steps: ["f_bridge", "j_analyst", "d_phd_econ"], base: -0.5, w: { quant: 1.6, research: 1.2, lowIncome: 0.5 } },
    { goal: "g_policy", steps: ["i_ngo", "f_meridian", "f_ypp", "j_policy_officer"], base: -0.4, w: { leadership: 1.4, writing: 1.0, languages: 1.2 } },
    { goal: "g_policy", steps: ["j_analyst", "f_ypp"], base: -0.3, w: { quant: 1.2, writing: 1.0, experience: 1.0 } },

    { goal: "g_founder", steps: ["f_venture", "j_startup_eng", "f_venture2", "r_seed"], base: -0.5, w: { entrepreneurship: 2.2, leadership: 1.2, design: 0.6 } },
    { goal: "g_founder", steps: ["i_bigtech", "j_swe", "j_pm_assoc", "r_seed"], base: -0.4, w: { coding: 1.2, entrepreneurship: 1.4, design: 0.8, econ: 0.6 } },
    { goal: "g_founder", steps: ["f_bridge", "d_msc_ai", "f_venture2", "r_seed"], base: -0.7, w: { entrepreneurship: 1.6, quant: 0.8, coding: 0.8, lowIncome: 0.4 } },
    { goal: "g_founder", steps: ["f_venture", "r_seed"], base: -1.0, w: { entrepreneurship: 2.6, communication: 1.0, econ: 0.9 } },

    { goal: "g_pm", steps: ["i_bigtech", "j_swe", "j_pm_assoc"], base: 0.0, w: { coding: 1.0, design: 1.4, communication: 1.0 } },
    { goal: "g_pm", steps: ["f_venture", "j_startup_eng", "j_pm_assoc"], base: -0.2, w: { entrepreneurship: 1.2, design: 1.4, leadership: 0.8 } },
    { goal: "g_pm", steps: ["i_ngo", "j_analyst", "d_mba"], base: -0.4, w: { leadership: 1.4, communication: 1.2, econ: 0.6 } },
    { goal: "g_pm", steps: ["f_bridge", "j_swe", "d_mba"], base: -0.3, w: { coding: 1.0, leadership: 1.2, design: 0.8, lowIncome: 0.4 } },

    { goal: "g_health", steps: ["i_bio", "d_mph", "j_ds"], base: 0.1, w: { quant: 1.2, coding: 1.0, research: 0.8 } },
    { goal: "g_health", steps: ["i_sre", "d_msc_ai", "j_ds"], base: -0.1, w: { coding: 1.6, quant: 1.2 } },
    { goal: "g_health", steps: ["f_bridge", "d_mph", "j_ds"], base: -0.1, w: { quant: 1.2, research: 0.8, lowIncome: 0.5 } },
    { goal: "g_health", steps: ["i_bio", "d_phd_bio", "f_postdoc"], base: -0.6, w: { research: 2.0, gpa: 1.2, coding: 0.8 } },
  ];

  D.FIRST = ["Amara", "Diego", "Priya", "Lin", "Sofia", "Kofi", "Yara", "Mateo", "Aisha", "Hiro", "Elena", "Tunde", "Nadia", "Rafael", "Mei", "Omar", "Zainab", "Lucas", "Ananya", "Joon", "Camila", "Ibrahim", "Leila", "Andrés", "Thandi", "Arjun", "Noor", "Sven", "Wanjiru", "Bao"];
  D.LAST = ["Mensah", "García", "Sharma", "Chen", "Rossi", "Boateng", "Haddad", "Silva", "Bello", "Tanaka", "Novak", "Adeyemi", "Karimi", "Ortega", "Wu", "Farouk", "Okoro", "Pereira", "Iyer", "Park", "Reyes", "Diallo", "Nasser", "Molina", "Dlamini", "Kapoor", "Aziz", "Lund", "Kamau", "Nguyen"];

  D.PRESETS = [
    { name: "Amara Okoro", region: "Sub-Saharan Africa", city: "Lagos", econ: 2, field: "Computer Science", level: 2, gpa: 3.7, exp: 1, languages: 3, s: { research: 7, coding: 8, quant: 8, writing: 5, leadership: 6, entrepreneurship: 4, communication: 6, design: 3 }, goal: "g_rs", degree: "BSc Computer Science", school: "University of Lagos" },
    { name: "Diego Molina", region: "Latin America", city: "Bogotá", econ: 3, field: "Economics", level: 1, gpa: 3.5, exp: 0, languages: 2, s: { research: 6, coding: 4, quant: 8, writing: 8, leadership: 5, entrepreneurship: 2, communication: 7, design: 2 }, goal: "g_policy", degree: "BA Economics", school: "Universidad de los Andes" },
    { name: "Priya Iyer", region: "South Asia", city: "Pune", econ: 4, field: "Engineering", level: 4, gpa: 3.2, exp: 3, languages: 3, s: { research: 3, coding: 8, quant: 6, writing: 5, leadership: 8, entrepreneurship: 9, communication: 8, design: 7 }, goal: "g_founder", degree: "BTech Mechanical Engineering", school: "College of Engineering Pune" },
  ];

  D.SOURCES = [
    { name: "Fellowship & scholarship portals", n: 1842, ago: "2 h" },
    { name: "University admissions pages", n: 3120, ago: "6 h" },
    { name: "Lab websites & faculty pages", n: 9604, ago: "1 d" },
    { name: "Company careers pages", n: 5277, ago: "3 h" },
    { name: "Public CVs & alumni trajectories", n: 48210, ago: "1 d" },
  ];
})();
