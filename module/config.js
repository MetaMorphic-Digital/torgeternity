import { TestResult } from './torgchecks.js';

export function initConfig() {

  const torgeternity = {};

  torgeternity.supportedLanguages = ['en', 'fr', 'de'];
  torgeternity.availableScreens = {
    none: 'None',
  };

  torgeternity.welcomeMessage = '';
  torgeternity.skillDialog = '';
  torgeternity.possibilitiesPerAct = 3;
  torgeternity.shockPerInspiration = 2;

  torgeternity.cardTypes = {
    drama: 'torgeternity.cardTypes.drama',
    destiny: 'torgeternity.cardTypes.destiny',
    cosm: 'torgeternity.cardTypes.cosm',
  };


  torgeternity.dramaConflicts = {
    none: 'torgeternity.drama.none',
    flurry: 'torgeternity.drama.flurry',
    inspiration: 'torgeternity.drama.inspiration',
    up: 'torgeternity.drama.up',
    confused: 'torgeternity.drama.confused',
    fatigued: 'torgeternity.drama.fatigued',
    setback: 'torgeternity.drama.setback',
    stymied: 'torgeternity.drama.stymied',
    surge: 'torgeternity.drama.surge',
  };

  torgeternity.dramaActions = {
    maneuver: "torgeternity.skills.maneuver",
    trick: "torgeternity.skills.trick",
    taunt: "torgeternity.skills.taunt",
    intimidate: "torgeternity.skills.intimidation",
    any: "torgeternity.dramaCard.any",
    attack: "torgeternity.dramaCard.attack",
    defend: "torgeternity.dramaCard.defend",
    multiAction: "torgeternity.dramaCard.multiAction",
    complication: "torgeternity.dramaCard.complication",
    criticalProblem: "torgeternity.dramaCard.criticalProblem",
    possibleSetback: "torgeternity.dramaCard.possibleSetback"
  }

  torgeternity.attributeTypes = {
    charisma: 'torgeternity.attributes.charisma',
    dexterity: 'torgeternity.attributes.dexterity',
    mind: 'torgeternity.attributes.mind',
    spirit: 'torgeternity.attributes.spirit',
    strength: 'torgeternity.attributes.strength',
  };

  torgeternity.zones = {
    pure: 'torgeternity.cosms.pure',
    dominant: 'torgeternity.cosms.dominant',
    mixed: 'torgeternity.cosms.mixed',
  };

  torgeternity.axioms = {
    tech: 'torgeternity.axioms.tech',
    social: 'torgeternity.axioms.social',
    spirit: 'torgeternity.axioms.spirit',
    magic: 'torgeternity.axioms.magic',
  };

  torgeternity.axiomsNoTech = {
    // Used for choosing a Secondary Axiom in items, where tech is already present
    social: 'torgeternity.axioms.social',
    spirit: 'torgeternity.axioms.spirit',
    magic: 'torgeternity.axioms.magic',
  };

  torgeternity.itemPurchaseCosm = {
    free: 'torgeternity.itemPurchase.free',
    activeScene: 'torgeternity.itemPurchase.activeScene',
    playerCosm: 'torgeternity.itemPurchase.playerCosm',
    itemCosm: 'torgeternity.itemPurchase.itemCosm',
    askPlayer: 'torgeternity.itemPurchase.askPlayer'
  }

  torgeternity.axiomByCosm = {
    coreEarth: {
      magic: 9,
      social: 23,
      spirit: 10,
      tech: 23,
    },
    aysle: {
      magic: 24,
      social: 16,
      spirit: 18,
      tech: 14,
    },
    cyberpapacy: {
      magic: 14,
      social: 18,
      spirit: 16,
      tech: 26,
    },
    livingLand: {
      magic: 1,
      social: 7,
      spirit: 24,
      tech: 6,
    },
    nileEmpire: {
      magic: 14,
      social: 20,
      spirit: 18,
      tech: 20,
    },
    orrorsh: {
      magic: 16,
      social: 18,
      spirit: 16,
      tech: 18,
    },
    panPacifica: {
      magic: 4,
      social: 24,
      spirit: 8,
      tech: 24,
    },
    tharkold: {
      magic: 12,
      social: 25,
      spirit: 4,
      tech: 25,
    },
  };

  torgeternity.actionLawCosms = ['nileEmpire', 'other'];

  torgeternity.cosmPossyIcons = {};
  torgeternity.cosmPossyLargeIcons = {};
  Object.keys(torgeternity.axiomByCosm).forEach(cosm => {
    torgeternity.cosmPossyIcons[cosm] = `systems/torgeternity/images/possy${(cosm === 'coreEarth') ? 'token' : '_' + cosm.toLowerCase()}.webp`;
    torgeternity.cosmPossyLargeIcons[cosm] = (cosm !== 'other') && `systems/torgeternity/images/cosm-icons/${cosm.toLowerCase()}.webp`;
  });

  Hooks.callAll('torgSetupCosms', torgeternity);

  torgeternity.cosmDecks = {};
  torgeternity.cosmTypes = { none: 'torgeternity.cosms.none' };

  Object.keys(torgeternity.axiomByCosm).forEach(cosm => {
    torgeternity.cosmDecks[cosm] = `torgeternity.cosmDecks.${cosm}`;
    torgeternity.cosmTypes[cosm] = `torgeternity.cosms.${cosm}`
  });
  // 'other' always goes last in cosmTypes (since they are in key-addition order in the Possibilities Popup)
  torgeternity.cosmTypes.other ??= 'torgeternity.cosms.other';
  torgeternity.cosmPossyIcons.other ??= `systems/torgeternity/images/possy_other.webp`;

  torgeternity.darknessModifiers = {
    none: 'torgeternity.sheetLabels.none',
    dim: 'torgeternity.darknessModifiers.dim',
    dark: 'torgeternity.darknessModifiers.dark',
    pitchBlack: 'torgeternity.darknessModifiers.pitchBlack',
  };

  torgeternity.levelDifferences = {
    none: 'torgeternity.sheetLabels.none',
    onePlus: 'torgeternity.levelDifferences.1+',
    twoPlus: 'torgeternity.levelDifferences.2+',
    threePlus: 'torgeternity.levelDifferences.3+',
    oneminus: 'torgeternity.levelDifferences.1-',
    twoMinus: 'torgeternity.levelDifferences.2-',
    threeMinus: 'torgeternity.levelDifferences.3-',
  };

  torgeternity.perkTypes = {
    cyberware: 'torgeternity.perkTypes.cyberware',
    darkness: 'torgeternity.perkTypes.darkness',
    dwarf: 'torgeternity.perkTypes.dwarf',
    edeinos: 'torgeternity.perkTypes.edeinos',
    electricSamurai: 'torgeternity.perkTypes.electricSamurai',
    elf: 'torgeternity.perkTypes.elf',
    faith: 'torgeternity.perkTypes.faith',
    kiPowers: 'torgeternity.perkTypes.kiPowers',
    leadership: 'torgeternity.perkTypes.leadership',
    light: 'torgeternity.perkTypes.light',
    occult: 'torgeternity.perkTypes.occult',
    occultech: 'torgeternity.perkTypes.occultech',
    outsider: 'torgeternity.perkTypes.outsider',
    prowess: 'torgeternity.perkTypes.prowess',
    psionics: 'torgeternity.perkTypes.psionics',
    pulpPowers: 'torgeternity.perkTypes.pulpPowers',
    reality: 'torgeternity.perkTypes.reality',
    savagery: 'torgeternity.perkTypes.savagery',
    social: 'torgeternity.perkTypes.social',
    spellcraft: 'torgeternity.perkTypes.spellcraft',
    racial: 'torgeternity.perkTypes.racial',
    human: 'torgeternity.perkTypes.human',
    hacker: 'torgeternity.perkTypes.hacker',
    abomination: 'torgeternity.perkTypes.abomination',
    aspirant: 'torgeternity.perkTypes.aspirant',
    depravity: 'torgeternity.perkTypes.depravity',
    theRace: 'torgeternity.perkTypes.theRace',
    corruption: 'torgeternity.perkTypes.corruption',
    hope: 'torgeternity.perkTypes.hope',
    cursed: 'torgeternity.perkTypes.cursed',
    biotech: 'torgeternity.perkTypes.biotech',
    powerSuit: 'torgeternity.perkTypes.powerSuit',
    invasion: 'torgeternity.perkTypes.invasion',
    stalenger: 'torgeternity.perkTypes.stalenger',
    groundSloth: 'torgeternity.perkTypes.groundSloth',
    special: 'torgeternity.perkTypes.special',
    legend: 'torgeternity.perkTypes.legend',
  };

  torgeternity.dnTypes = {
    fixedNumber: 'torgeternity.dnTypes.fixedNumber',
    veryEasy: 'torgeternity.dnTypes.veryEasy',
    easy: 'torgeternity.dnTypes.easy',
    standard: 'torgeternity.dnTypes.standard',
    challenging: 'torgeternity.dnTypes.challenging',
    hard: 'torgeternity.dnTypes.hard',
    veryHard: 'torgeternity.dnTypes.veryHard',
    heroic: 'torgeternity.dnTypes.heroic',
    nearImpossible: 'torgeternity.dnTypes.nearImpossible',
    // Attributes
    targetCharisma: 'torgeternity.dnTypes.targetCharisma',
    targetDexterity: 'torgeternity.dnTypes.targetDexterity',
    targetMind: 'torgeternity.dnTypes.targetMind',
    targetSpirit: 'torgeternity.dnTypes.targetSpirit',
    targetStrength: 'torgeternity.dnTypes.targetStrength',
    // Skills
    targetAirVehicles: 'torgeternity.dnTypes.targetAirVehicles',
    targetAlteration: 'torgeternity.dnTypes.targetAlteration',
    targetApportation: 'torgeternity.dnTypes.targetApportation',
    targetBeastRiding: 'torgeternity.dnTypes.targetBeastRiding',
    targetComputers: 'torgeternity.dnTypes.targetComputers',
    targetConjuration: 'torgeternity.dnTypes.targetConjuration',
    targetDivination: 'torgeternity.dnTypes.targetDivination',
    targetDodge: 'torgeternity.dnTypes.targetDodge',
    targetEnergyWeapons: 'torgeternity.dnTypes.targetEnergyWeapons',
    targetEvidenceAnalysis: 'torgeternity.dnTypes.targetEvidenceAnalysis',
    targetFaith: 'torgeternity.dnTypes.targetFaith',
    targetFind: 'torgeternity.dnTypes.targetFind',
    targetFireCombat: 'torgeternity.dnTypes.targetFireCombat',
    targetFirstAid: 'torgeternity.dnTypes.targetFirstAid',
    targetHeavyWeapons: 'torgeternity.dnTypes.targetHeavyWeapons',
    targetIntimidation: 'torgeternity.dnTypes.targetIntimidation',
    targetKinesis: 'torgeternity.dnTypes.targetKinesis',
    targetLandVehicles: 'torgeternity.dnTypes.targetLandVehicles',
    targetLanguage: 'torgeternity.dnTypes.targetLanguage',
    targetLockpicking: 'torgeternity.dnTypes.targetLockpicking',
    targetManeuver: 'torgeternity.dnTypes.targetManeuver',
    targetMedicine: 'torgeternity.dnTypes.targetMedicine',
    targetMeleeWeapons: 'torgeternity.dnTypes.targetMeleeWeapons',
    targetMissileWeapons: 'torgeternity.dnTypes.targetMissileWeapons',
    targetPersuasion: 'torgeternity.dnTypes.targetPersuasion',
    targetPrecognition: 'torgeternity.dnTypes.targetPrecognition',
    targetProfession: 'torgeternity.dnTypes.targetProfession',
    targetReality: 'torgeternity.dnTypes.targetReality',
    targetScholar: 'torgeternity.dnTypes.targetScholar',
    targetStealth: 'torgeternity.dnTypes.targetStealth',
    targetStreetwise: 'torgeternity.dnTypes.targetStreetwise',
    targetSurvival: 'torgeternity.dnTypes.targetSurvival',
    targetTaunt: 'torgeternity.dnTypes.targetTaunt',
    targetTelepathy: 'torgeternity.dnTypes.targetTelepathy',
    targetTracking: 'torgeternity.dnTypes.targetTracking',
    targetTrick: 'torgeternity.dnTypes.targetTrick',
    targetUnarmedCombat: 'torgeternity.dnTypes.targetUnarmedCombat',
    targetWaterVehicles: 'torgeternity.dnTypes.targetWaterVehicles',
    targetWillpower: 'torgeternity.dnTypes.targetWillpower',
    // Other
    targetWillpowerMind: 'torgeternity.dnTypes.targetWillpowerMind',
    highestSpeed: 'torgeternity.dnTypes.highestSpeed',
    targetVehicleDefense: 'torgeternity.dnTypes.targetVehicleDefense',
  };

  torgeternity.dnTypesBasic = {
    fixedNumber: 'torgeternity.dnTypes.fixedNumber',
    veryEasy: 'torgeternity.dnTypes.veryEasy',
    easy: 'torgeternity.dnTypes.easy',
    standard: 'torgeternity.dnTypes.standard',
    challenging: 'torgeternity.dnTypes.challenging',
    hard: 'torgeternity.dnTypes.hard',
    veryHard: 'torgeternity.dnTypes.veryHard',
    heroic: 'torgeternity.dnTypes.heroic',
    nearImpossible: 'torgeternity.dnTypes.nearImpossible',
    highestSpeed: 'torgeternity.dnTypes.highestSpeed',
  };

  torgeternity.attackTypes = {
    unarmedCombat: 'torgeternity.attackTypes.unarmedCombat',
    meleeWeapons: 'torgeternity.attackTypes.meleeWeapons',
    missileWeapons: 'torgeternity.attackTypes.missileWeapons',
    fireCombat: 'torgeternity.attackTypes.fireCombat',
    energyWeapons: 'torgeternity.attackTypes.energyWeapons',
    heavyWeapons: 'torgeternity.attackTypes.heavyWeapons',
  };

  torgeternity.damageTypes = {
    flat: 'torgeternity.damageTypes.flat',
    strengthPlus: 'torgeternity.damageTypes.strengthPlus',
    charismaPlus: 'torgeternity.damageTypes.charismaPlus',
    dexterityPlus: 'torgeternity.damageTypes.dexterityPlus',
    mindPlus: 'torgeternity.damageTypes.mindPlus',
    spiritPlus: 'torgeternity.damageTypes.spiritPlus',
  };

  torgeternity.powerSkills = {
    alteration: 'torgeternity.powerSkills.alteration',
    apportation: 'torgeternity.powerSkills.apportation',
    conjuration: 'torgeternity.powerSkills.conjuration',
    divination: 'torgeternity.powerSkills.divination',
    kinesis: 'torgeternity.powerSkills.kinesis',
    precognition: 'torgeternity.powerSkills.precognition',
    telepathy: 'torgeternity.powerSkills.telepathy',
    faith: 'torgeternity.powerSkills.faith',
  };

  torgeternity.clearances = {
    alpha: 'torgeternity.clearances.alpha',
    beta: 'torgeternity.clearances.beta',
    gamma: 'torgeternity.clearances.gamma',
    delta: 'torgeternity.clearances.delta',
    omega: 'torgeternity.clearances.omega',
  };

  torgeternity.races = {
    human: 'torgeternity.races.human',
    dwarf: 'torgeternity.races.dwarf',
    edeinos: 'torgeternity.races.edeinos',
    elf: 'torgeternity.races.elf',
    aspirants: 'torgeternity.races.aspirants',
    theRace: 'torgeternity.races.theRace',
    other: 'torgeternity.races.other',
  };

  torgeternity.skills = {
    airVehicles: 'torgeternity.skills.airVehicles',
    alteration: 'torgeternity.skills.alteration',
    apportation: 'torgeternity.skills.apportation',
    beastRiding: 'torgeternity.skills.beastRiding',
    computers: 'torgeternity.skills.computers',
    conjuration: 'torgeternity.skills.conjuration',
    divination: 'torgeternity.skills.divination',
    dodge: 'torgeternity.skills.dodge',
    energyWeapons: 'torgeternity.skills.energyWeapons',
    evidenceAnalysis: 'torgeternity.skills.evidenceAnalysis',
    faith: 'torgeternity.skills.faith',
    find: 'torgeternity.skills.find',
    fireCombat: 'torgeternity.skills.fireCombat',
    firstAid: 'torgeternity.skills.firstAid',
    heavyWeapons: 'torgeternity.skills.heavyWeapons',
    intimidation: 'torgeternity.skills.intimidation',
    kinesis: 'torgeternity.skills.kinesis',
    landVehicles: 'torgeternity.skills.landVehicles',
    language: 'torgeternity.skills.language',
    lockpicking: 'torgeternity.skills.lockpicking',
    maneuver: 'torgeternity.skills.maneuver',
    medicine: 'torgeternity.skills.medicine',
    meleeWeapons: 'torgeternity.skills.meleeWeapons',
    missileWeapons: 'torgeternity.skills.missileWeapons',
    persuasion: 'torgeternity.skills.persuasion',
    precognition: 'torgeternity.skills.precognition',
    profession: 'torgeternity.skills.profession',
    reality: 'torgeternity.skills.reality',
    scholar: 'torgeternity.skills.scholar',
    science: 'torgeternity.skills.science',
    stealth: 'torgeternity.skills.stealth',
    streetwise: 'torgeternity.skills.streetwise',
    survival: 'torgeternity.skills.survival',
    taunt: 'torgeternity.skills.taunt',
    telepathy: 'torgeternity.skills.telepathy',
    tracking: 'torgeternity.skills.tracking',
    trick: 'torgeternity.skills.trick',
    unarmedCombat: 'torgeternity.skills.unarmedCombat',
    waterVehicles: 'torgeternity.skills.waterVehicles',
    willpower: 'torgeternity.skills.willpower',
  };

  torgeternity.concentrationSkills = [
    // Spells
    'alteration',
    'apportation',
    'conjuration',
    'divination',
    // Miracles
    'faith',
    // Psionics
    'kinesis',
    'precognition',
    'telepathy'
  ];

  torgeternity.stymiedStates = {
    none: 'torgeternity.stymiedStates.none',
    stymied: 'torgeternity.stymiedStates.stymied',
    veryStymied: 'torgeternity.stymiedStates.veryStymied',
  };

  torgeternity.vulnerableStates = {
    none: 'torgeternity.vulnerableStates.none',
    vulnerable: 'torgeternity.vulnerableStates.vulnerable',
    veryVulnerable: 'torgeternity.vulnerableStates.veryVulnerable',
  };

  torgeternity.yesNo = {
    true: 'torgeternity.yesNo.true',
    false: 'torgeternity.yesNo.false',
  };

  torgeternity.sizes = {
    tiny: 'torgeternity.sizes.tiny',
    verySmall: 'torgeternity.sizes.verySmall',
    small: 'torgeternity.sizes.small',
    normal: 'torgeternity.sizes.normal',
    large: 'torgeternity.sizes.large',
    veryLarge: 'torgeternity.sizes.veryLarge',
  };

  torgeternity.blastRadius = {
    small: 'torgeternity.blastRadi.small',
    medium: 'torgeternity.blastRadi.medium',
    large: 'torgeternity.blastRadi.large',
    veryLarge: 'torgeternity.blastRadi.veryLarge',
    huge: 'torgeternity.blastRadi.huge',
  };

  torgeternity.speeds = {
    fast: 'torgeternity.speeds.fast',
    veryFast: 'torgeternity.speeds.veryFast',
    ultraFast: 'torgeternity.speeds.ultraFast',
  };

  torgeternity.vehicleTypes = {
    land: 'torgeternity.vehicleTypes.land',
    water: 'torgeternity.vehicleTypes.water',
    air: 'torgeternity.vehicleTypes.air',
  };

  torgeternity.magnitudes = {
    ones: 'torgeternity.magnitudes.ones',
    thousands: 'torgeternity.magnitudes.thousands',
    millions: 'torgeternity.magnitudes.millions',
    billions: 'torgeternity.magnitudes.billions',
  };

  torgeternity.implantTypes = {
    cyberware: 'torgeternity.perkTypes.cyberware',
    occultech: 'torgeternity.perkTypes.occultech',
    geneMod: 'torgeternity.perkTypes.biotech',
  }

  torgeternity.statusEffects = [
    {
      img: 'systems/torgeternity/images/status-markers/stymied.webp',
      id: 'stymied',
      _id: 'stymied000000000',
      name: 'torgeternity.statusEffects.stymied',
      duration: { rounds: 1, turns: 1, expiry: 'turnEnd' },
    },
    {
      img: 'systems/torgeternity/images/status-markers/very-stymied.webp',
      id: 'veryStymied',
      _id: 'veryStymied00000',
      name: 'torgeternity.statusEffects.veryStymied',
      duration: { rounds: 1, turns: 1, expiry: 'turnEnd' },
    },
    {
      img: 'systems/torgeternity/images/status-markers/vulnerable.webp',
      id: 'vulnerable',
      _id: 'vulnerable000000',
      name: 'torgeternity.statusEffects.vulnerable',
      duration: { rounds: 1, turns: 1, expiry: 'turnEnd' },
    },
    {
      img: 'systems/torgeternity/images/status-markers/very-vulnerable.webp',
      id: 'veryVulnerable',
      _id: 'veryVulnerable00',
      name: 'torgeternity.statusEffects.veryVulnerable',
      duration: { rounds: 1, turns: 1, expiry: 'turnEnd' },
    },
    {
      img: 'systems/torgeternity/images/status-markers/disconnected.webp',
      id: 'disconnected',
      _id: 'disconnected0000',
      name: 'torgeternity.statusEffects.disconnected',
    },
    {
      img: 'systems/torgeternity/images/status-markers/aiming.webp',
      id: 'aiming',
      _id: 'aiming0000000000',
      name: 'torgeternity.statusEffects.aiming',
    },
    {
      img: 'systems/torgeternity/images/status-markers/malfunction.webp',
      id: 'malfunction',
      _id: 'malfunction00000',
      name: 'torgeternity.statusEffects.malfunction',
    },
    {
      img: 'systems/torgeternity/images/status-markers/concentrating.webp',
      id: 'concentrating',
      _id: 'concentrating000',
      name: 'torgeternity.statusEffects.concentrating',
    },
    {
      img: 'systems/torgeternity/images/status-markers/restrained.webp',
      id: 'restrained',
      _id: 'restrained000000',
      name: 'torgeternity.statusEffects.restrained',
    },
    {
      img: 'systems/torgeternity/images/status-markers/dark-2.webp',
      id: 'dim',
      _id: 'dim0000000000000',
      name: 'torgeternity.statusEffects.dim',
    },
    {
      img: 'systems/torgeternity/images/status-markers/dark-4.webp',
      id: 'dark',
      _id: 'dark000000000000',
      name: 'torgeternity.statusEffects.dark',
    },
    {
      img: 'systems/torgeternity/images/status-markers/dark-6.webp',
      id: 'pitchBlack',
      _id: 'pitchBlack000000',
      name: 'torgeternity.statusEffects.pitchBlack',
    },
    {
      img: 'systems/torgeternity/images/status-markers/waiting.webp',
      id: 'waiting',
      _id: 'waiting000000000',
      name: 'torgeternity.statusEffects.waiting',
    },
    {
      img: 'icons/svg/skull.svg',
      id: 'dead',
      _id: 'dead000000000000',
      name: 'torgeternity.statusEffects.dead',
    },
    {
      img: 'icons/svg/falling.svg',
      id: 'prone',
      _id: 'prone00000000000',
      name: 'torgeternity.statusEffects.prone',
    },
    {
      img: 'icons/svg/paralysis.svg',
      id: 'incapacitated',
      _id: 'incapacitated000',
      name: 'torgeternity.statusEffects.incapacitated',
    },
    {
      img: 'icons/svg/unconscious.svg',
      id: 'unconscious',
      _id: 'unconscious00000',
      name: 'torgeternity.statusEffects.unconscious',
    },
    {
      img: 'icons/svg/blind.svg',
      id: 'blind',
      _id: 'blind00000000000',
      name: 'torgeternity.statusEffects.blind',
    },
  ];

  torgeternity.defenseTraits = {
    'fatigues': 'torgeternity.traits.fatigues',
    'fullBody': 'torgeternity.traits.fullBody',
    'torso': 'torgeternity.traits.torso',
    'head': 'torgeternity.traits.head',
    'painful': 'torgeternity.traits.painful',
    'ignoreShock': 'torgeternity.traits.ignoreShock',
    'ignoreWounds': 'torgeternity.traits.ignoreWounds',
    'supernaturalEvil': 'torgeternity.traits.supernaturalEvil'
  }

  torgeternity.meleeWeaponTraits = {
    "trademark": "torgeternity.sheetLabels.trademark",
    'nonLethal': 'torgeternity.traits.nonLethal',
    'painful': 'torgeternity.traits.painful',
    'stagger': 'torgeternity.traits.stagger',
    'small': 'torgeternity.traits.small',
    'quick': 'torgeternity.traits.quick',
    'wounding': 'torgeternity.traits.wounding',
    'dazing': 'torgeternity.traits.dazing',
    'fragile': 'torgeternity.traits.fragile',
    'thrown': 'torgeternity.traits.thrown',
    'twoHanded': 'torgeternity.traits.twoHanded',
    'unwieldy': 'torgeternity.traits.unwieldy',
    'grapple': 'torgeternity.traits.grapple',
    //'bob': 'torgeternity.traits.bob',
  }

  torgeternity.rangedWeaponTraits = {
    "trademark": "torgeternity.sheetLabels.trademark",
    'painful': 'torgeternity.traits.painful',
    'nonLethal': 'torgeternity.traits.nonLethal',
    'stagger': 'torgeternity.traits.stagger',
    'small': 'torgeternity.traits.small',
    'quick': 'torgeternity.traits.quick',
    'wounding': 'torgeternity.traits.wounding',
    'dazing': 'torgeternity.traits.dazing',
    'shortBurst': 'torgeternity.traits.shortBurst',
    'longBurst': 'torgeternity.traits.longBurst',
    'heavyBurst': 'torgeternity.traits.heavyBurst',
    'bulky': 'torgeternity.traits.bulky',
    'reload': 'torgeternity.traits.reload',
    'blackPowder': 'torgeternity.traits.blackPowder',
    'smallBlast': 'torgeternity.traits.smallBlast',
    'mediumBlast': 'torgeternity.traits.mediumBlast',
    'largeBlast': 'torgeternity.traits.largeBlast',
    'veryLargeBlast': 'torgeternity.traits.veryLargeBlast',
    'hugeBlast': 'torgeternity.traits.hugeBlast',
    'shotgun': 'torgeternity.traits.shotgun',
    'pistol': 'torgeternity.traits.pistol',
    'carbine': 'torgeternity.traits.carbine',
    'lowestArmor': 'torgeternity.traits.lowestArmor',
    'ignoresArmor': 'torgeternity.traits.ignoresArmor',
    'ignoreWounds': 'torgeternity.traits.ignoreWounds',
    'energyDamage': 'torgeternity.traits.energyDamage',
    'fireDamage': 'torgeternity.traits.fireDamage',
    'forceDamage': 'torgeternity.traits.forceDamage',
    'iceDamage': 'torgeternity.traits.iceDamage',
    'lightningDamage': 'torgeternity.traits.lightningDamage',
    'thrown': 'torgeternity.traits.thrown',
  }

  torgeternity.allItemTraits = {
    ...Object.entries(torgeternity.defenseTraits).reduce((acc, ent) => { acc[ent[0]] = { label: ent[1], group: 'torgeternity.traitGroup.defense' }; return acc }, {}),
    ...Object.entries(torgeternity.meleeWeaponTraits).reduce((acc, ent) => { acc[ent[0]] = { label: ent[1], group: 'torgeternity.traitGroup.melee' }; return acc }, {}),
    ...Object.entries(torgeternity.rangedWeaponTraits).reduce((acc, ent) => { acc[ent[0]] = { label: ent[1], group: 'torgeternity.traitGroup.ranged' }; return acc }, {}),
  }


  torgeternity.specificItemTraits = {
    // ammunition
    // armor
    // customAttack
    // customSkill
    // enhancement
    // eternityshard
    // firearm
    // gear
    // heavyweapon
    // implant
    // meleeweapon
    // miracle (power)
    // missileweapon
    // perk
    // psionicpower (power)
    // race
    // shield
    // specialability
    // specialability-rollable
    // spell (power)
    // vehicle
    // vehicleAddOn
    armor: torgeternity.defenseTraits,
    shield: torgeternity.defenseTraits,
    meleeweapon: torgeternity.meleeWeaponTraits,
    missileweapon: torgeternity.rangedWeaponTraits,
    heavyweapon: torgeternity.rangedWeaponTraits,
    firearm: torgeternity.rangedWeaponTraits,
    customAttack: { ...torgeternity.meleeWeaponTraits, ...torgeternity.rangedWeaponTraits }
  }

  // animation time period for transitioning to dim light or Dark.
  torgeternity.toDimLightAnimationMS = 3000;
  torgeternity.toDarkAnimationMS = 3000;
  // How long to wait between calls to darknessDebounce before processing it
  torgeternity.darknessDebounceMS = 100;

  torgeternity.carryTypes = ['held', 'worn', 'stowed', 'dropped'];

  // All choices must use strings, since number 0 will be treated as undefined by {{radioBoxes}}
  torgeternity.choices = {
    calledShot: {
      [0]: 'torgeternity.sheetLabels.none',
      [-2]: '-2',
      [-4]: '-4',
      [-6]: '-6',
    },
    burst: {
      [0]: 'torgeternity.sheetLabels.none',
      [2]: 'torgeternity.sheetLabels.shortBurst',
      [4]: 'torgeternity.sheetLabels.longBurst',
      [6]: 'torgeternity.sheetLabels.heavyBurst',
    },
    addBDs: [0, 1, 2, 3, 4, 5],
    movement: {
      [0]: 'torgeternity.sheetLabels.walking',
      [-2]: 'torgeternity.sheetLabels.running',
    },
    multipleActions: {
      [0]: '1',
      [-2]: '2',
      [-4]: '3',
      [-6]: '4',
    },
    targets: {
      [0]: '1',
      [-2]: '2',
      [-4]: '3',
      [-6]: '4',
      [-8]: '5',
      [-10]: '6',
    },
    concealment: {
      [0]: 'torgeternity.sheetLabels.none',
      [-2]: '-2',
      [-4]: '-4',
      [-6]: '-6',
    }
  }

  // Fixed strings needed for Data Models
  torgeternity.testOutcomeLabel = {
    [TestResult.UNKNOWN]: "",
    [TestResult.MISHAP]: 'torgeternity.chatText.check.result.mishape',
    [TestResult.FAILURE]: 'torgeternity.chatText.check.result.failure',
    [TestResult.STANDARD]: 'torgeternity.chatText.check.result.standardSuccess',
    [TestResult.GOOD]: 'torgeternity.chatText.check.result.goodSuccess',
    [TestResult.OUTSTANDING]: 'torgeternity.chatText.check.result.outstandingSuccess'
  }

  // Hard-coded, so that we are guaranteed to have it available immediately
  torgeternity.cosmTypeFromLabel = {
    "(Keins)": "none",
    "(Ninguno)": "none",
    "(Non)": "none",
    "(None)": "none",
    "(Sans cosm)": "none",
    "Andere": "other",
    "Autre": "other",
    "Aysle": "aysle",
    "Ciberpapado": "cyberpapacy",
    "Core Earth": "coreEarth",
    "Cyberpapacy": "cyberpapacy",
    "Cyberpapauté": "cyberpapacy",
    "Cyberpontifikat": "cyberpapacy",
    "Das Lebende Land": "livingLand",
    "Empire du Nil": "nileEmpire",
    "Imperio Nilo": "nileEmpire",
    "Living Land": "livingLand",
    "Nil Imperium": "nileEmpire",
    "Nil-Imperium": "nileEmpire",
    "Nile Empire": "nileEmpire",
    "Orrorsh": "orrorsh",
    "Other": "other",
    "Otro": "other",
    "Pan Pacifica": "panPacifica",
    "Prime Terre": "coreEarth",
    "Terre-Vivante": "livingLand",
    "Terre vivante": "livingLand",
    "Terre Vivante": "livingLand",
    "Tharkold": "tharkold",
    "Tierra Base": "coreEarth",
    "Tierra Viviente": "livingLand",
    "Zentralerde": "coreEarth",
  }

  CONFIG.torgeternity = torgeternity;
}

Hooks.once('i18nInit', () => {
  // Translate number magnitude strings (fast lookup for GeneralItemData.prepareBaseData)
  CONFIG.torgeternity.magnitudeLabels = {};
  for (const [key, value] of Object.entries(CONFIG.torgeternity.magnitudes))
    CONFIG.torgeternity.magnitudeLabels[key] = game.i18n.localize(value);
  for (const value of CONFIG.statusEffects) {
    const key = `torgeternity.statusEffects.description.${value.id}`
    const desc = game.i18n.localize(key);
    if (desc !== key) value.description = desc;
  }
})