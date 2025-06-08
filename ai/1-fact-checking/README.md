# 1-Fact-Checking: Research & Verification Prompts

## Purpose
Prompts for Phase 2 - Atomic Research & Fact-Checking. These ensure zero hallucinations through systematic verification of all factual claims.

## Research Generation Prompts

### Atomic Research File Creation
```
I need to research [SPECIFIC TOPIC] for my blog post. Help me create a comprehensive atomic research file by:

1. What are the key facts I should know about [TOPIC]?
2. Who are the authoritative experts or researchers in this area?
3. What are the most credible sources for information on [TOPIC]?
4. What specific claims need careful verification?
5. What background context is essential for understanding this topic?

Please provide specific facts with source suggestions, but remind me that ALL claims must be independently verified before use.
```

### Historical Research Prompt
```
I need verified historical information about [HISTORICAL EVENT/PERSON/DISCOVERY]. Help me research:

1. What are the key dates, names, and locations?
2. Who were the primary sources or witnesses?
3. What academic publications cover this topic authoritatively?
4. What are common misconceptions or myths about this topic?
5. What primary source documents exist?

Provide research directions but emphasize that I must verify all details against authoritative sources.
```

### Technical Specification Research
```
I need accurate technical information about [TECHNOLOGY/PRODUCT/PROCESS]. Help me research:

1. What are the precise specifications or capabilities?
2. What companies or institutions are authoritative sources?
3. What official documentation exists?
4. What technical papers or reports cover this?
5. What are the most important metrics or measurements?

Focus on verifiable technical details from official sources.
```

## Fact-Checking Prompts

### Claim Verification Protocol
```
I found this claim in my research: [SPECIFIC CLAIM]

Help me verify this systematically:

1. What type of source would be authoritative for this claim?
2. What specific details need verification (names, dates, numbers)?
3. What would constitute adequate confirmation?
4. What red flags should I watch for that suggest this might be inaccurate?
5. How can I cross-check this against multiple sources?

Guide me through rigorous verification without accepting anything at face value.
```

### Source Quality Assessment
```
Evaluate this source for my blog post research: [SOURCE DESCRIPTION]

Help me assess:

1. What type of source is this (primary, secondary, tertiary)?
2. What are the author's credentials and potential biases?
3. What is the publication's reputation and editorial standards?
4. How recent is this information, and does recency matter?
5. What would make this source more or less credible?

Rate this source's reliability for factual claims about [TOPIC].
```

### Cross-Reference Verification
```
I have conflicting information about [TOPIC] from different sources:

Source A claims: [CLAIM A]
Source B claims: [CLAIM B]

Help me resolve this discrepancy:

1. Which source appears more authoritative and why?
2. How can I find additional sources to break the tie?
3. Is there a way both could be partially correct?
4. What additional context might explain the difference?
5. Should I avoid this claim entirely if I can't verify it conclusively?

Guide me to the most accurate information.
```

## Zero Hallucination Verification

### Name and Affiliation Check
```
Verify these people and institutions mentioned in my research:

[LIST OF NAMES, TITLES, INSTITUTIONS]

For each person/institution, help me confirm:

1. Correct spelling of names
2. Accurate titles and affiliations  
3. Relevant credentials or expertise
4. Any changes in position since the research date
5. Authoritative sources for biographical information

I need to ensure every name and affiliation is 100% accurate.
```

### Date and Timeline Verification
```
Check these historical dates and sequences for my blog post:

[LIST OF DATES AND EVENTS]

Help me verify:

1. Accuracy of specific dates
2. Correct chronological sequence
3. Relationship between events and timelines
4. Any conflicting information in sources
5. Appropriate level of precision (year vs. month vs. day)

I need absolute accuracy for all temporal claims.
```

### Statistical and Numerical Verification
```
Verify these numbers and statistics from my research:

[LIST OF STATISTICS, MEASUREMENTS, FINANCIAL FIGURES]

For each number, help me check:

1. Original source and calculation method
2. Units of measurement and precision
3. Date of data collection
4. Whether figures have been updated since publication
5. Context that affects interpretation

I need to ensure all quantitative claims are accurate and current.
```

## Documentation Prompts

### Source Documentation Template
```
Help me properly document this source for my atomic research file:

Source type: [BOOK/ARTICLE/REPORT/WEBSITE]
Details: [AUTHOR, TITLE, PUBLICATION, DATE, URL]

Format this according to proper citation standards and help me note:

1. Full bibliographic information
2. Date I accessed the source
3. Specific pages or sections referenced
4. Any paywall or access restrictions
5. Reliability assessment notes

Create a complete source entry I can reference later.
```

### Verification Status Tracking
```
Help me assess the verification status of my atomic research file on [TOPIC]:

Claims to verify: [LIST OF CLAIMS]
Sources checked: [LIST OF SOURCES]

Evaluate:

1. Which claims are fully verified with authoritative sources?
2. Which claims need additional verification?
3. Which claims should be removed due to lack of verification?
4. What gaps remain in my research?
5. Is this file ready to mark as ✅ VERIFIED?

Guide me to complete, rigorous verification.
```

## Quality Control Prompts

### Hallucination Detection
```
Review my research notes for potential hallucinations or inaccuracies:

[RESEARCH CONTENT]

Red flags to check:

1. Any claims that seem too convenient or perfect?
2. Details that are unusually specific without clear sourcing?
3. Names, dates, or numbers that should be double-checked?
4. Anything that contradicts well-established facts?
5. Claims I cannot independently verify?

Help me identify anything that needs additional verification or removal.
```

### Research Completeness Check
```
Assess whether my research on [TOPIC] is sufficient for my blog thesis:

My thesis: [THESIS STATEMENT]
Research completed: [SUMMARY OF RESEARCH]

Evaluate:

1. Do I have enough verified facts to support my thesis?
2. What gaps might weaken my argument?
3. Are there obvious objections I haven't researched?
4. What additional research would strengthen my position?
5. Am I ready to move to analysis, or do I need more facts?

Help me determine if my research foundation is solid.
```

## Usage Guidelines

### Best Practices
- Never accept AI-provided "facts" without independent verification
- Use multiple authoritative sources for important claims
- Document everything - source, date accessed, specific pages
- When in doubt, verify again or remove the claim
- Mark verification status clearly on all research files

### Red Flags
- Sources that can't be independently accessed
- Claims that seem too good to be true
- Information that contradicts established facts
- Details without clear attribution
- Sources with obvious bias or agenda

### Next Phase
Only proceed to `2-analysis` when all atomic research files are marked ✅ VERIFIED with authoritative sources. 