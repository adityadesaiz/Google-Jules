export const PROFILE_BASELINE = {
  targetParameters: {
    roles: [
      "Deputy Vice President (DVP)",
      "Director of AI Architecture",
      "Lead Cloud/Data Architect",
      "Head of Data & AI Governance",
    ],
    sectors: [
      "Regulated financial entities",
      "NBFCs",
      "FinTech",
      "Enterprise Banking",
    ],
    geographies: [
      "Singapore",
      "Dubai (UAE)",
      "APAC",
      "Canada",
      "Poland",
      "EU countries",
    ],
  },
  elitePillars: {
    aiAndGenAIScale: {
      description: "Enterprise Agentic AI voice bots",
      metrics: [
        "15k+ daily calls",
        "sub-200ms latency",
        "Azure STT/TTS",
        "GPT-4o",
        "DPDP Act 2023 compliance",
        "hallucination guardrails",
        "70% manual effort reduction",
        "Designed first GenAI Data Dictionary for NBFC data governance",
      ],
    },
    dataEstate: {
      description: "Petabyte-scale multi-cloud",
      metrics: [
        "~2.5 PB+ across Azure, AWS, GCP for MMFSL, MIBL, MRHFL, MMIMPL",
        "Databricks Certified Platform Architect",
        "Unity Catalog migrations (9k+ tables across 4 regulated entities)",
        "Real-time high-throughput transactional ETL (UPI, Cards, Core Banking) for fraud/cross-sell",
        "AWS Redshift Lakehouse (3 months delivery via Snow Family)",
      ],
    },
    finOpsGovernance: {
      description: "Cost optimization and infrastructure efficiency",
      metrics: [
        "36.8% Azure daily run rate reduction (slashing monthly run rates from 86.7L to 54.8L)",
        "97 Container Apps KEDA Cron Scaling, VM right-sizing, auto-stop (projected 2.5-3.0 Cr/year saving)",
        "Storage lifecycle optimization across 69 accounts",
        "900+ TB estate Storage Savings Plan execution",
        "Cosmos DB 26x cost surge remediation within 24 hours (45% structural saving, RBI-compliant)",
        "Power BI to Fabric migration (128 CU reservation, saving 82L/year)",
      ],
    },
    securityAndCompliance: {
      description: "Audit closure and vulnerability management",
      metrics: [
        "Closed 30+ formal RBI audit findings",
        "VAPT programme triage (329 findings total, 81 immediate, 126 closed in days)",
        "Zero critical outages across cloud migrations",
        "75% security incident reduction",
        "PCI-DSS compliance frameworks",
      ],
    },
    executiveLeadership: {
      description: "Director-equivalent level reporting and strategic initiatives",
      metrics: [
        "Director-equivalent level reporting to CDAO across 4 regulated entities",
        "Presented 16 cloud governance initiatives directly to CXO leadership",
        "Enforced governance checklists challenging 2-day Data Lake Landing Zone plans (>1TB Delta tables, 25+ apps)",
        "Zscaler rollout covering 80-82% customer APIs (<=4hr SLA, 30-sec rollback)",
        "1.1 Cr/month Azure EA billing governance (3-day validation SLA)",
        "Databricks Visionary Award 2025",
      ],
    },
  },
  macroCompliance: {
    UAE: {
      region: "United Arab Emirates (Dubai/Abu Dhabi)",
      visa: "Golden Visa pathways for senior corporate managers",
      minSalaryThreshold: ">=AED 30,000/month",
      context: ["0% personal income tax", "Central Bank of the UAE / ADGM / DIFC regulations"],
    },
    SaudiArabia: {
      region: "Saudi Arabia (Riyadh)",
      visa: "Premium Residency 'Special Talent / Executive' tracks",
      minSalaryThreshold: ">=SAR 80,000/month",
      context: ["0% personal income tax", "SAMA/SDAIA regulatory alignment", "compound infrastructure setups"],
    },
    Qatar: {
      region: "Qatar (Doha)",
      visa: "non-sponsored Executive Residence Permit tier",
      minSalaryThreshold: "QAR 50,000 - QAR 80,000/month",
      context: ["0% personal income tax", "Qatar Financial Centre (QFC) / Qatar Central Bank compliance"],
    },
    Singapore: {
      region: "Singapore",
      visa: "Employment Pass (EP) optimized for the 2026 COMPASS point-audit framework",
      minSalaryThreshold: "S$6,200 to S$11,800+/month depending on age/seniority brackets",
      context: ["MAS regulations", "high-density fintech volume"],
    },
    HongKong: {
      region: "Hong Kong",
      visa: "Top Talent Pass Scheme (TTPS) Category A",
      minSalaryThreshold: "trailing annual income >=HKD 2.5 Million",
      context: ["Capped progressive income tax (15-16%)", "HKMA frameworks"],
    },
    Malaysia: {
      region: "Malaysia (Kuala Lumpur)",
      visa: "June 2026 updated Category I Employment Pass framework",
      minSalaryThreshold: ">=RM 20,000/month (allowances/bonuses excluded; fixed 10-year employer tenure cap)",
      context: ["Bank Negara Malaysia (BNM) cloud frameworks"],
    },
    Australia: {
      region: "Australia (Sydney/Melbourne)",
      visa: "July 2026 updated Specialist Skills Income Threshold (SSIT) under the Skills in Demand Subclass 482 framework",
      minSalaryThreshold: ">=AUD 146,576/year",
      context: ["APRA CPS 234 operational resilience frameworks", "priority 7-day median visa processing"],
    },
  },
} as const;

export type ProfileBaselineType = typeof PROFILE_BASELINE;
