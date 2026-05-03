export interface SubTopic {
  name: string;
}

export interface Topic {
  name: string;
  subs: string[];
}

export interface Subject {
  id: string;
  name: string;
  short: string;
  icon: string;
  color: string;
  bg: string;
  topics: Topic[];
}

export interface SyllabusData {
  prelims: Subject[];
  mains: Subject[];
  optional: Subject[];
}

export const SYLLABUS_DATA: SyllabusData = {
  prelims: [
    {
      id: 'history',
      name: 'History',
      short: 'History',
      icon: '📜',
      color: '#e07b39',
      bg: 'rgba(224,123,57,.11)',
      topics: [
        {
          name: 'Ancient India',
          subs: [
            'Pre History (Stone Age)',
            'Indus Valley Civilization',
            'Vedic Society',
            'Pre Mauryan-Period (Mahajanapadas)',
            'Mauryan Empire',
            'Post-Mauryan Age (Shungas, Satavahanas, Kushanas)',
            'Imperial Guptas',
            'Harshavardana',
            'Sangam Age (Cholas, Cheras, Pandyas)',
            'Jainism',
            'Buddhism',
          ],
        },
        {
          name: 'Medieval India',
          subs: [
            'Early Medieval India\'s Major Dynasties (750–1200 AD)',
            'Cholas and Other South Indian Kingdoms',
            'Delhi Sultanate (1206-1526 AD)',
            'Vijayanagara and Bahmini Kingdom',
            'Central Asian Politics & Struggle for Empire in North India',
            'Mughals Empire',
            'Regional kingdoms (Marathas, Rajputs, Sikhs, Ahoms)',
            'Bhakti and Sufi Movements',
          ],
        },
        {
          name: 'Art & Culture',
          subs: [
            'Architecture and Sculpture',
            'Indian Paintings',
            'Poery Heritage in India',
            'Music in India',
            'Dance in India',
            'Martial arts',
            'Indian Theatre',
            'Indian Puppetry',
            'Indian Cinema',
            'Religions in India',
            'Fairs & Festival in India',
            'Schools of Philosphy',
            'Literature and language',
            'Miscellaneous & Contemporary Topics',
          ],
        },
        {
          name: 'Modern',
          subs: [
            'Advent of Europeans and British expansion',
            'Later Mughals & Regional powers',
            'Revolt of 1857',
            'Early Nationalism',
            'INC- Moderate Phase (1885 - 1919)',
            'Extremist Phase & Revolutionary Activism',
            'Emergence of Gandhi & Gandhian movements',
            'National movement (1919 - 1939)',
            'Freedom to Partition (1939 - 1947)',
            'Socio - Religious Reform Movements in the 19th and 20th CE India',
            'Important Lists - Acts, Committee, Congress Sessions, Governor General & Viceroys, Role of Women, Press, Peasants, Tribals, Princely States, Education reforms, Important Personalities',
          ],
        },
      ],
    },
    {
      id: 'geography',
      name: 'Geography',
      short: 'Geog.',
      icon: '🌍',
      color: '#2e7dd4',
      bg: 'rgba(46,125,212,.10)',
      topics: [
        {
          name: 'Physical Geography of the World',
          subs: [
            'Geomorphology: Solar System & interior of the Earth',
            'Geomorphology: Distribution of Continents & Oceans',
            'Geomorphology: Earthquakes, Volcano and Tsunami',
            'Geomorphology: Landforms and their Evolution',
            'Climatology: Composition of Atmosphere, Layers',
            'Climatology: Heat Balance, Temperature, Circulation',
            'Climatology: Pressure Belts and Wind System',
            'Climatology: Air Mass, Water in the Atmosphere',
            'Climatology: Jet Streams, Tropical & Temperate Cyclone',
            'Climatology: El Nino & La Nina, World Climate',
            'Oceanography: Oceans, Temperature, Salinity',
            'Oceanography: Ocean Current, Resources from Ocean',
            'Biogeography: Soil, Vegetation Resources',
          ],
        },
        {
          name: 'Physical Geography of India',
          subs: [
            'Physiography of India, Structure',
            'Drainage System',
            'Climate',
            'Soils in India',
            'Natural Vegetation',
          ],
        },
        {
          name: 'Economic Geography',
          subs: [
            'Agriculture: Land Resource, Basic terms',
            'Agriculture: Major cropping patterns in various parts of the country; different types of irrigation and irrigation systems',
            'Mineral resource',
            'Energy resources',
            'Industry',
            'Transport and Communication',
          ],
        },
        {
          name: 'Human Geography',
          subs: [
            'Population: distribution, density, growth, migration',
            'Urbanization: trends, problems',
            'Census',
          ],
        },
      ],
    },
    {
      id: 'polity',
      name: 'Polity',
      short: 'Polity',
      icon: '⚖️',
      color: '#7c3aed',
      bg: 'rgba(124,58,237,.09)',
      topics: [
        {
          name: 'Historical Evolution & Making of Constitution',
          subs: [
          ],
        },
        {
          name: 'Salient Features, Preamble, Schedules, Amendments',
          subs: [
          ],
        },
        {
          name: 'Citizenship, Union & its Territory',
          subs: [
          ],
        },
        {
          name: 'Basic Structure, Separation of Powers',
          subs: [
          ],
        },
        {
          name: 'Fundamental Rights, Directive Principles, Fundamental Duties',
          subs: [
          ],
        },
        {
          name: 'Union and State Executive',
          subs: [
          ],
        },
        {
          name: 'Parliament and State Legislatures',
          subs: [
          ],
        },
        {
          name: 'Judiciary',
          subs: [
          ],
        },
        {
          name: 'Federalism: Centre-State relations, Emergency provisions, Inter-State Council',
          subs: [
          ],
        },
        {
          name: 'Local government: Panchayati Raj, Municipalities',
          subs: [
          ],
        },
        {
          name: 'Constitutional bodies: Election Commission, UPSC, CAG, Finance Commission',
          subs: [
          ],
        },
        {
          name: 'Statutory bodies: NHRC, NCW, NCSC, NCST, Lokpal',
          subs: [
          ],
        },
        {
          name: 'Non-constitutional bodies: NITI Aayog, CBI, NIA',
          subs: [
          ],
        },
        {
          name: 'Political parties and election process, Anti Defection',
          subs: [
          ],
        },
      ],
    },
    {
      id: 'economy',
      name: 'Economy',
      short: 'Economy',
      icon: '📈',
      color: '#059669',
      bg: 'rgba(5,150,105,.09)',
      topics: [
        {
          name: 'Basic Economy',
          subs: [
            'Money, Demand and Supply, CRR, SLR',
            'Monetary policy in India',
            'Banking and Issues',
            'Sebi, Share market',
            'Insurance , Pension and Financial inclusion',
            'Economic Planning, GDP, GNP, Niti Aayog',
            'Inflation: types, causes, measures',
            'Unemployment: types, causes, trends, schemes',
            'Indian Economy and issues relating to planning',
          ],
        },
        {
          name: 'Public Finance',
          subs: [
            'Government Budgeting',
            'Fiscal policy: Budget, Deficits, FRBM Act',
            'Taxation',
            'Subsidies, Expenditure, Receipts, Disinvestment',
          ],
        },
        {
          name: 'External Sector',
          subs: [
            'BOP, Int Trade, Currency Exchange',
            'WTO, Trade agreements, International Organisations',
          ],
        },
        {
          name: 'Agriculture',
          subs: [
            'Role of Agriculture in Indian Economy',
            'Land resource, Land Reforms',
            'Agricultural Revolutions in India',
            'Agriculture Finance, Agricultural Credit Institutions, Crop Insurance, MSP, PM - Kisan',
          ],
        },
        {
          name: 'Sectors of Economy',
          subs: [
            'Industrial Policy and Industrial Development, Issues',
            'Main features of Industrial development in India',
            'Manufacturing, Service, LPG Reforms, Make-in-India, MSME, Textile',
          ],
        },
        {
          name: 'Infrastructure',
          subs: [
            'Transport: roads, railways, ports, airports, logistics',
            'Investment Models',
            'Important Schemes, PM-Gati Shakti',
          ],
        },
        {
          name: 'Human Resource Development',
          subs: [
            'Population, Health, Hunger',
            'Education, Skill, Poverty',
            'Weaker section, HDI, SDGs',
            'Inclusive growth and issues arising from it',
            'Resource Mobilization',
          ],
        },
      ],
    },
    {
      id: 'penv',
      name: 'Environment & Ecology',
      short: 'Enviro.',
      icon: '🌿',
      color: '#16a34a',
      bg: 'rgba(22,163,74,.09)',
      topics: [
        {
          name: 'Ecology & Ecosystem',
          subs: [
            'Ecology',
            'Ecosystem: structure, types, functions, energy flow',
            'Food chains, food webs, ecological pyramids',
            'Biogeochemical Cycles',
            'Terrestrial Ecosystem',
            'Aquatic Ecosystems',
          ],
        },
        {
          name: 'Biodiversity',
          subs: [
            'Biodiversity Basics, levels, flora, fauna, hotspots, threats',
            'Biodiversity Protection Measures: National Initiative',
            'Biodiversity Protection Measures: Global Initiative',
          ],
        },
        {
          name: 'Pollution',
          subs: [
            'Pollutants classification, causes, sources',
            'Environmental pollution: air, water, soil, noise, e-waste etc',
            'Solid Waste, e-waste Management',
            'Environmental Impact Assessment',
          ],
        },
        {
          name: 'Climate Change',
          subs: [
            'Basics of Climate change, GHG, Ozone, Acid Rain',
            'Mitigation Strategies: Sequestration, Geo-eng, green building',
            'Mitigation Strategies: Global initiatives (UNFCCC, REDD, IPCC, GCF)',
            'Mitigation Strategies: National Initiatives (EPA\'86, WPA\'72 etc)',
          ],
        },
        {
          name: 'Conservation Efforts',
          subs: [
            'Environmental Laws, Acts and Policies',
            'Protected Area Networks: NP, WLS, Ramsar sites etc',
            'Schemes and Govt. Bodies',
            'International Environmental Governance',
            'Environment related Institutions and Organizations',
          ],
        },
      ],
    },
    {
      id: 'pst',
      name: 'Science & Technology',
      short: 'Science',
      icon: '🔬',
      color: '#d97706',
      bg: 'rgba(217,119,6,.09)',
      topics: [
        {
          name: 'General Science',
          subs: [
            'Physics: Motion, Force, Work, Energy, Sound, Light, Electricity, Magnetism, Heat, Modern physics',
            'Chemistry: Atomic structure, Periodic table, Chemical bonding, Acids-bases, Salts, Environmental chemistry, Polymers, Fertilizers, Drugs',
            'Biology: Cell structure, Genetics, Evolution, Organ system and Human physiology, Plant and Animal Physiology',
          ],
        },
        {
          name: 'Biotechnology',
          subs: [
            'Genetic Engineering, Process and Application',
            'Genomics, Proteomics',
            'RNA Types & Technology',
            'Genome sequencing and Its Applications',
            'Biotechnology and medicine',
            'Biosafety protocols, Bioethics and Biopiracy',
            'IPR in Biotechnology',
            'Recent trends in biotechnology and applied biotechnology',
          ],
        },
        {
          name: 'Human Health & Diseases',
          subs: [
            'Human Diseases',
            'Immunity and its types',
            'Vaccination and Immunisation',
            'Vaccination program of India',
            'Medicines',
          ],
        },
        {
          name: 'Space',
          subs: [
            'Types of orbits, Space terms',
            'Types of Launch Vehicles and application',
            'ISRO and its role in national  development',
            'Private sector in space',
            'Public-private partnership in space sector',
            'Space tech: satellites, GSLV, PSLV, Gaganyaan, Space Man Mission',
            'Various Space Observatories',
            'Various Telemetry',
            'Navigation',
          ],
        },
        {
          name: 'Defence',
          subs: [
            'Missile System & Classification',
            'Ballistics And Cruise Missile',
            'India’s Missile System',
            'Integrated Guided Missile Program',
            'Missile Defence Programmes',
            'Defense technology: missiles, drones, indigenous weapons',
            'Defence Reforms',
            'Defence Organizations and laboratories',
            'Defence Exercises',
          ],
        },
        {
          name: 'Nuclear Energy',
          subs: [
            'Types of nuclear reactions',
            'Nuclear Energy and its application',
            'Nuclear Fuels and Centrifugation',
            'Nuclear Reactor',
            'Nuclear Policy of India',
            'Nuclear Radiation and Its impact',
            'Radioactive Waste',
            'Nuclear & Radiological Disasters',
            'Institutions involved in  Nuclear Energy Development',
          ],
        },
        {
          name: 'Electronics & Communications & IT',
          subs: [
            'Computers, Mobile Generations',
            'Information Technology',
            'Display Technologies',
            'Internet of Things',
            'Big Data Initiative and Privacy',
            'Cyber-crime and cybersecurity',
            'Robotics',
            'Emerging trends, blockchain, virtual reality',
            'Machine Learning & Artificial Intelligence',
            'Government Initiatives, BHIM, UPI',
          ],
        },
        {
          name: 'Nano Science & Nano - Technology',
          subs: [
            'Basics of Nano Science and Nano Technology',
            'Nanomaterial',
            'Applications & Impacts of Nano Technology',
            'Nano Science & Nano technology in India',
          ],
        },
      ],
    },
  ],
  mains: [
    {
      id: 'mhistory',
      name: 'History',
      short: 'History',
      icon: '📜',
      color: '#e07b39',
      bg: 'rgba(224,123,57,.11)',
      topics: [
        {
          name: 'Ancient India',
          subs: [
            'Pre History (Stone Age)',
            'Indus Valley Civilization',
            'Vedic Society',
            'Pre Mauryan-Period (Mahajanapadas)',
            'Mauryan Empire',
            'Post-Mauryan Age (Shungas, Satavahanas, Kushanas)',
            'Imperial Guptas',
            'Harshavardana',
            'Sangam Age (Cholas, Cheras, Pandyas)',
            'Jainism',
            'Buddhism',
          ],
        },
        {
          name: 'Medieval India',
          subs: [
            'Early Medieval India\'s Major Dynasties (750–1200 AD)',
            'Cholas and Other South Indian Kingdoms',
            'Delhi Sultanate (1206-1526 AD)',
            'Vijayanagara and Bahmini Kingdom',
            'Central Asian Politics & Struggle for Empire in North India',
            'Mughals Empire',
            'Regional kingdoms (Marathas, Rajputs, Sikhs, Ahoms)',
            'Bhakti and Sufi Movements',
          ],
        },
        {
          name: 'Art & Culture',
          subs: [
            'Architecture and Sculpture',
            'Indian Paintings',
            'Poery Heritage in India',
            'Music in India',
            'Dance in India',
            'Martial arts',
            'Indian Theatre',
            'Indian Puppetry',
            'Indian Cinema',
            'Religions in India',
            'Fairs & Festival in India',
            'Schools of Philosphy',
            'Literature and language',
            'Miscellaneous & Contemporary Topics',
          ],
        },
        {
          name: 'Modern',
          subs: [
            'Advent of Europeans and British expansion',
            'Later Mughals & Regional powers',
            'Revolt of 1857',
            'Early Nationalism',
            'INC- Moderate Phase (1885 - 1919)',
            'Extremist Phase & Revolutionary Activism',
            'Emergence of Gandhi & Gandhian movements',
            'National movement (1919 - 1939)',
            'Freedom to Partition (1939 - 1947)',
            'Socio - Religious Reform Movements in the 19th and 20th CE India',
            'Important Lists - Acts, Committee, Congress Sessions, Governor General & Viceroys, Role of Women, Press, Peasants, Tribals, Princely States, Education reforms, Important Personalities',
          ],
        },
      ],
    },
    {
      id: 'mgeography',
      name: 'Geography',
      short: 'Geog.',
      icon: '🌍',
      color: '#2e7dd4',
      bg: 'rgba(46,125,212,.10)',
      topics: [
        {
          name: 'Physical Geography of the World',
          subs: [
            'Geomorphology: Solar System & interior of the Earth',
            'Geomorphology: Distribution of Continents & Oceans',
            'Geomorphology: Earthquakes, Volcano and Tsunami',
            'Geomorphology: Landforms and their Evolution',
            'Climatology: Composition of Atmosphere, Layers',
            'Climatology: Heat Balance, Temperature, Circulation',
            'Climatology: Pressure Belts and Wind System',
            'Climatology: Air Mass, Water in the Atmosphere',
            'Climatology: Jet Streams, Tropical & Temperate Cyclone',
            'Climatology: El Nino & La Nina, World Climate',
            'Oceanography: Oceans, Temperature, Salinity',
            'Oceanography: Ocean Current, Resources from Ocean',
            'Biogeography: Soil, Vegetation Resources',
          ],
        },
        {
          name: 'Physical Geography of India',
          subs: [
            'Physiography of India, Structure',
            'Drainage System',
            'Climate',
            'Soils in India',
            'Natural Vegetation',
          ],
        },
        {
          name: 'Economic Geography',
          subs: [
            'Agriculture: Land Resource, Basic terms',
            'Agriculture: Major cropping patterns in various parts of the country; different types of irrigation and irrigation systems',
            'Mineral resource',
            'Energy resources',
            'Industry',
            'Transport and Communication',
          ],
        },
        {
          name: 'Human Geography',
          subs: [
            'Population: distribution, density, growth, migration',
            'Urbanization: trends, problems',
            'Census',
          ],
        },
      ],
    },
    {
      id: 'mpolity',
      name: 'Polity',
      short: 'Polity',
      icon: '⚖️',
      color: '#7c3aed',
      bg: 'rgba(124,58,237,.09)',
      topics: [
        {
          name: 'Historical Evolution & Making of Constitution',
          subs: [
          ],
        },
        {
          name: 'Salient Features, Preamble, Schedules, Amendments',
          subs: [
          ],
        },
        {
          name: 'Citizenship, Union & its Territory',
          subs: [
          ],
        },
        {
          name: 'Basic Structure, Separation of Powers',
          subs: [
          ],
        },
        {
          name: 'Fundamental Rights, Directive Principles, Fundamental Duties',
          subs: [
          ],
        },
        {
          name: 'Union and State Executive',
          subs: [
          ],
        },
        {
          name: 'Parliament and State Legislatures',
          subs: [
          ],
        },
        {
          name: 'Judiciary',
          subs: [
          ],
        },
        {
          name: 'Federalism: Centre-State relations, Emergency provisions, Inter-State Council',
          subs: [
          ],
        },
        {
          name: 'Local government: Panchayati Raj, Municipalities',
          subs: [
          ],
        },
        {
          name: 'Constitutional bodies: Election Commission, UPSC, CAG, Finance Commission',
          subs: [
          ],
        },
        {
          name: 'Statutory bodies: NHRC, NCW, NCSC, NCST, Lokpal',
          subs: [
          ],
        },
        {
          name: 'Non-constitutional bodies: NITI Aayog, CBI, NIA',
          subs: [
          ],
        },
        {
          name: 'Political parties and election process, Anti Defection',
          subs: [
          ],
        },
      ],
    },
    {
      id: 'meconomy',
      name: 'Economy',
      short: 'Economy',
      icon: '📈',
      color: '#059669',
      bg: 'rgba(5,150,105,.09)',
      topics: [
        {
          name: 'Basic Economy',
          subs: [
            'Money, Demand and Supply, CRR, SLR',
            'Monetary policy in India',
            'Banking and Issues',
            'Sebi, Share market',
            'Insurance , Pension and Financial inclusion',
            'Economic Planning, GDP, GNP, Niti Aayog',
            'Inflation: types, causes, measures',
            'Unemployment: types, causes, trends, schemes',
            'Indian Economy and issues relating to planning',
          ],
        },
        {
          name: 'Public Finance',
          subs: [
            'Government Budgeting',
            'Fiscal policy: Budget, Deficits, FRBM Act',
            'Taxation',
            'Subsidies, Expenditure, Receipts, Disinvestment',
          ],
        },
        {
          name: 'External Sector',
          subs: [
            'BOP, Int Trade, Currency Exchange',
            'WTO, Trade agreements, International Organisations',
          ],
        },
        {
          name: 'Agriculture',
          subs: [
            'Role of Agriculture in Indian Economy',
            'Land resource, Land Reforms',
            'Agricultural Revolutions in India',
            'Agriculture Finance, Agricultural Credit Institutions, Crop Insurance, MSP, PM - Kisan',
          ],
        },
        {
          name: 'Sectors of Economy',
          subs: [
            'Industrial Policy and Industrial Development, Issues',
            'Main features of Industrial development in India',
            'Manufacturing, Service, LPG Reforms, Make-in-India, MSME, Textile',
          ],
        },
        {
          name: 'Infrastructure',
          subs: [
            'Transport: roads, railways, ports, airports, logistics',
            'Investment Models',
            'Important Schemes, PM-Gati Shakti',
          ],
        },
        {
          name: 'Human Resource Development',
          subs: [
            'Population, Health, Hunger',
            'Education, Skill, Poverty',
            'Weaker section, HDI, SDGs',
            'Inclusive growth and issues arising from it',
            'Resource Mobilization',
          ],
        },
      ],
    },
    {
      id: 'mpenv',
      name: 'Environment & Ecology',
      short: 'Enviro.',
      icon: '🌿',
      color: '#16a34a',
      bg: 'rgba(22,163,74,.09)',
      topics: [
        {
          name: 'Ecology & Ecosystem',
          subs: [
            'Ecology',
            'Ecosystem: structure, types, functions, energy flow',
            'Food chains, food webs, ecological pyramids',
            'Biogeochemical Cycles',
            'Terrestrial Ecosystem',
            'Aquatic Ecosystems',
          ],
        },
        {
          name: 'Biodiversity',
          subs: [
            'Biodiversity Basics, levels, flora, fauna, hotspots, threats',
            'Biodiversity Protection Measures: National Initiative',
            'Biodiversity Protection Measures: Global Initiative',
          ],
        },
        {
          name: 'Pollution',
          subs: [
            'Pollutants classification, causes, sources',
            'Environmental pollution: air, water, soil, noise, e-waste etc',
            'Solid Waste, e-waste Management',
            'Environmental Impact Assessment',
          ],
        },
        {
          name: 'Climate Change',
          subs: [
            'Basics of Climate change, GHG, Ozone, Acid Rain',
            'Mitigation Strategies: Sequestration, Geo-eng, green building',
            'Mitigation Strategies: Global initiatives (UNFCCC, REDD, IPCC, GCF)',
            'Mitigation Strategies: National Initiatives (EPA\'86, WPA\'72 etc)',
          ],
        },
        {
          name: 'Conservation Efforts',
          subs: [
            'Environmental Laws, Acts and Policies',
            'Protected Area Networks: NP, WLS, Ramsar sites etc',
            'Schemes and Govt. Bodies',
            'International Environmental Governance',
            'Environment related Institutions and Organizations',
          ],
        },
      ],
    },
    {
      id: 'mpst',
      name: 'Science & Technology',
      short: 'Science',
      icon: '🔬',
      color: '#d97706',
      bg: 'rgba(217,119,6,.09)',
      topics: [
        {
          name: 'General Science',
          subs: [
            'Physics: Motion, Force, Work, Energy, Sound, Light, Electricity, Magnetism, Heat, Modern physics',
            'Chemistry: Atomic structure, Periodic table, Chemical bonding, Acids-bases, Salts, Environmental chemistry, Polymers, Fertilizers, Drugs',
            'Biology: Cell structure, Genetics, Evolution, Organ system and Human physiology, Plant and Animal Physiology',
          ],
        },
        {
          name: 'Biotechnology',
          subs: [
            'Genetic Engineering, Process and Application',
            'Genomics, Proteomics',
            'RNA Types & Technology',
            'Genome sequencing and Its Applications',
            'Biotechnology and medicine',
            'Biosafety protocols, Bioethics and Biopiracy',
            'IPR in Biotechnology',
            'Recent trends in biotechnology and applied biotechnology',
          ],
        },
        {
          name: 'Human Health & Diseases',
          subs: [
            'Human Diseases',
            'Immunity and its types',
            'Vaccination and Immunisation',
            'Vaccination program of India',
            'Medicines',
          ],
        },
        {
          name: 'Space',
          subs: [
            'Types of orbits, Space terms',
            'Types of Launch Vehicles and application',
            'ISRO and its role in national  development',
            'Private sector in space',
            'Public-private partnership in space sector',
            'Space tech: satellites, GSLV, PSLV, Gaganyaan, Space Man Mission',
            'Various Space Observatories',
            'Various Telemetry',
            'Navigation',
          ],
        },
        {
          name: 'Defence',
          subs: [
            'Missile System & Classification',
            'Ballistics And Cruise Missile',
            'India’s Missile System',
            'Integrated Guided Missile Program',
            'Missile Defence Programmes',
            'Defense technology: missiles, drones, indigenous weapons',
            'Defence Reforms',
            'Defence Organizations and laboratories',
            'Defence Exercises',
          ],
        },
        {
          name: 'Nuclear Energy',
          subs: [
            'Types of nuclear reactions',
            'Nuclear Energy and its application',
            'Nuclear Fuels and Centrifugation',
            'Nuclear Reactor',
            'Nuclear Policy of India',
            'Nuclear Radiation and Its impact',
            'Radioactive Waste',
            'Nuclear & Radiological Disasters',
            'Institutions involved in  Nuclear Energy Development',
          ],
        },
        {
          name: 'Electronics & Communications & IT',
          subs: [
            'Computers, Mobile Generations',
            'Information Technology',
            'Display Technologies',
            'Internet of Things',
            'Big Data Initiative and Privacy',
            'Cyber-crime and cybersecurity',
            'Robotics',
            'Emerging trends, blockchain, virtual reality',
            'Machine Learning & Artificial Intelligence',
            'Government Initiatives, BHIM, UPI',
          ],
        },
        {
          name: 'Nano Science & Nano - Technology',
          subs: [
            'Basics of Nano Science and Nano Technology',
            'Nanomaterial',
            'Applications & Impacts of Nano Technology',
            'Nano Science & Nano technology in India',
          ],
        },
      ],
    },
  ],
  optional: [],
};