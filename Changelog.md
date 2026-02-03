# TORG Eternity Changelog

## NEXT

- Use **token name** of the target in the chat card, not the actor name (since token might have prefix/suffix)
- Add missing translation key for an Actor starts concentrating on a power, `torgeternity.chatText.concentration.start`
- **Token Action Hud**
  - Add **PERKS** tab
  - Allow making a **Tapping** Roll on eternity shards

## 13.19.0 - Attributes, Price, Inspiration, Item Piles & Token Action HUD

- Avoid aborting migration early during editing of an Actor (the edit still occurs).
- Update the **expanded attributes** displayed for Items in Actor sheet lists:
  - Hide price when no price is set.
  - Add "Price:" prefix (localized) when price is shown.
  - Hide ammo when max ammo is 0 or not set.
  - Tidy up layout of other aspects.
- Update **price** handling:
  - Ignore commas in price when calculating its Torg Value (Javascript doesn't support locale-sensitive conversion).
  - Update how price is stored consistently between vehicles and items.
- Change how **dice** are displayed in the Chat so dice which are actually exploded are marked as exploded (so 20 on unskilled rolls aren't marked as exploded).
  - Show **manual dice rolls** (d20 and/or d6) against each rolled dice (game system option to disable).
- Drama Card **Inspiration** improvements:
  - Add configuration parameter for how much shock is recovered on Inspiration, `CONFIG.torgernity.shockPerInspiration` (default 2)
  - Add `actor.system.other.inspiration` field to Actors which can be modified by Active Effects which specifies how much shock is recovered when Inspiration occurs (default value: `CONFIG.torgernity.shockPerInspiration`). _(useful for Rune of Replenishment)_
  - Prevent error if vehicle has friendly/hostile disposition when applying Inspiration.
- Some basic changes to make it slightly compatible with **Item Piles** (only applicable if you have the module enabled).
  - All physical items have a quantity field (not always displayed in the Item sheet since most owned Items can't be stacked)
  - Eternity Shard is now based on `GeneralItemData` instead of `BaseItemData`
  - Basic Item Piles configuration is automatically set by the game system.
  - Item Piles Currencies are determined by looking for all Currency Items in the world sidebar and in compendiums.
  - **TODO**: Please raise an issue if there are any improvements to the default configuration which you find useful.
- Add some basic support for **Token Action HUD** providing Skills, Attacks and Powers in the HUD.
  - A game setting determines whether unskilled skills appear in the HUD's Skills list.
  - HUD buttons are marked with a HAND for equipped gear and a STAR for favored skills.

## 13.18.3 - Resetting Possibilities & Tapping Eternity Shards

- Add roll button on Eternity Shards to roll Reality against the **Tapping Difficulty** of the Shard.
- Display **Eternity Shards on STATS tab** of the Storknight sheet for easier access to the Tapping Roll.
- Add a button in SK sheets and Eternity Shards to **reset the number of possibilities** at the start of the Act.
  - Hold SHIFT on the SK sheet to automatically reset used possibilities on owned Eternity Shards as well.
- Allow **number of possibilities per Act** for SKs to be configured with `CONFIG.torgeternity.possibilitiesPerAct`
  - Active Effects can modify the number per act by modifying the property `system.other.possibilities.perAct`
  - Any existing AE that modifies `system.other.possibilities` will be automatically changed to modify `system.other.possibilities.perAct` (e.g. Prodigy perk)

- Translations by Durak (French), Helmut (German), and Teotimus (Spanish).

## 13.18.2 - Fix Custom Skill Name in chat message

- Ensures that the custom skill name (not id) is displayed in the test chat message.

## 13.18.1 - Eternity Shards

- Update Eternity Shards to have current/max fields for Possibilities.
- Allow possibilities within Eternity Shards to be chosen in the Possibility selection dialog.
- Tidy up the "Notes:" section of chat notes so that each use of Possibilities appears on its own line.

## 13.18.0 - Darkness, Armor/Defense, Cosm Possibilities

- Prevent error from automatic darkness calculation when an Actor has two or more linked tokens on the same scene.
  - The game system will now use one of the tokens consistently to determine the darkness level appropriate for the Actor (usually the first token dragged onto the canvas, but not guaranteed [actually the first token returned by `Actor.getActiveTokens()`]).
- Add CONFIG flags to make customisation easier:
  - `CONFIG.torgeternity.toDimLightAnimationMS` - time to transition to Dim Light.
  - `CONFIG.torgeternity.toDarkAnimationMS` - time to transition to Dark (light level).
  - `CONFIG.torgeternity.darknessDebounceMS` - time after final token movement before Automatic Darkness Calculation is performed.
- Add support for extra Armor or Protection vs Energy/Fire/Force/Ice/Lightning:
  - The "Armor vs X" and "Defense vs X" item traits have been removed.
  - add the following modifiers via Active Effects (with `Apply Effect to Actor`), each with a numeric value that modifiers the armor/defense:
    - `defenses.damageTraits.lightningArmor` adds to the Armor vs a weapon with the `lightningDamage` trait
    - `defenses.damageTraits.lightningDefense` adds to the Defense vs a weapon with the `lightningDamage` trait
    - (substitute any of the damage types in the above examples)
- When spending a Possibilty to modify a check result, allow CTRL to be pressed to popup a dialog to allow spending of possibilities from other cosms.
  - The cosm name will be added to the "Possibility Spent" note in the updated chat message.
  - Only the cosms of which the SK has at least one possibility will be presented. If the SK has no cosm-specific possibilities, then a standard possibility will be used without prompting for a cosm.
  - Cancelling the dialog (or pressing the 'Standard' button) will spend a standard possibility.

- Translations by Durak (French), Helmut (German), and Teotimus (Spanish).

## 13.17.0

- Reword message when **insufficient ammunition** (not just bullets) is available based on number of targets or selected burst.
- Ensure height of Stormknight sheet doesn't overflow the available window height.
- Add icon (with tooltip) to each deck in the **Cards Directory** (right sidebar) indicating those decks which have been configured in the Default Card Deck Configuration window.
- Allow GM to click in the "Type" column of a Player Hand to **open the deck** from which that card came.
- Add option for player to **return a card** to its original card (e.g. if the player drew a card from the wrong deck) by holding SHIFT while pressing the "Discard" button.
- Add macro **Shuffle & Deal Destiny at Start of Scene** to recall all destiny cards, shuffle the destiny deck, and then deal 4 cards to the default actor for each online player.
- Update Active Effects to also support Foundry 14 (14.353, Prototype 3)

## 13.16.3

- Hide the various Torg-specific darkness level slider in the Scene Config when **Automatic Darkness Penalties** is disabled.
- Add **Transition to Dim Light** and **Transition to Dark** buttons in the Lighting controls menu.
- Fix bug that was preventing **rolling attribute checks on Threats**.
- Setting the **max ammo** requirement of a weapon to 0 (or blank) will indicate that the weapon has infinite ammo (or does not use ammo).
- When determining **ammo usage**, the number of targets is based on either the number of targeted tokens, or else the number of targets selected in the multi-target penalty.

## 13.16.2

- Minor adjustment to darkness level calculation (using ">=" instead of ">") so that pitchBlack slider set to 1 (rather than 0.95) sets pitchBlack when the scene darkness level is 1.
- Fix bug which prevented a Darkness Level brighter than the Dim Light Threshold left the tokens in dim light.

## 13.16.1

- Fix an error in skill checks when no target has been selected.

## 13.16.0

- **Darkness Modifier** of the TARGET(s) is used in the attack test, not the darkness modifier of the attacker.
  - Add new `targetModifiers.darkness` property to Actors so that Darkvision (and similar abilities) can be implemented (set the AE to have `4` as the value, to reduce the darkness penalty by a maximum of 4).
  - Game System archetypes (dragon warrior, elven warden) updated to have the AE for Darkvision (EN, DE, FR).
- Adds a game setting (default enabled) to **automatically calculate the Darkness Penalty** for a token based on the current lighting situation at the token's location on the active scene.
  - There are sliders in the scene configuration dialog to specify the darkness level used to determine Dim, Dark, Pitch Black separately for each scene.
  - The calculation is done on the ACTIVE scene (not the current scene).
  - The ACTIVE scene must have vision enabled.
  - The calculation is done by the active GM (so if no GM is logged in the automation does not occur).
  - The calculation accounts for:
    - Scene's global illumination value
    - Regions with an "Adjust Darkness Level" behavior
    - Light and Dark sources on the scene (either directly placed or via tokens)
    - Darkness sources always override any other level of lighting (setting Pitch Black)
- Add **card numbers** to all cards in the core card decks.
  - When viewing a deck, the sorting by number or shuffle order now works.

### Internal
- Remove `card.system.number` from all Cards, storing the value in `card.value` instead.
- Translations by Durak (French), Teotimus (Spanish), Helmut (German)
- Darkness Penalty code originally based on the SWADE Illuminator module by kristianserrano.

### Bug Fixes

- Fixes #635: Skills and Attributes which appear in `@Buff` enrichers are now localized when the default label is created.
- Ensure Effects Panel is updated when the effects on the selected actor change.
- Fixes #637: Hide "convert to rollable" if the item is not editable.

## 13.15.0

- **Apply Effects from Chat**: When posting an Item to chat, if the Item has any Active Effects on it (which are NOT transferred to the owner) then the chat card will provide buttons to allow each of the effects to be applied to the currently targeted token(s).
- Game System option to display a **Effects Panel** for the currently selected token:
  - A game setting is provided to show passive effects as well as temporary effects (by default they are not shown).
  - _Hover_ over the effect in the list to view the name of the effect.
  - _Left click_ on an effect to open the editor for that effect.
  - _Right click_ on an effect to delete it from the actor (or disable if on an item owned by the actor).
- Fixes #632: The 'modifier' field of powers is now stored as a Number not a String.
- Fixes #631: Having an Active Effect modify the 'adds' of a skill will now be handled properly when edits are made in the Actor sheet.

## 13.14.3

- Powers updated in `en` Archetypes.
- Update 'fr' Archetypes to match the effects available on 'en' archetypes.
- Ward Enemy AEs changed to be applied to the target when the spell is cast.

## 13.14.2

- Allow arbitrary numbers in `@Check` enricher.
- Check for unskilled-use in the `@Check` enricher.
- Add a new game setting "Disable Dynamic Token Ring on Import" which will disable the use of dynamic token ring in the prototype token when an Actor is imported from a compendium.

## 13.14.1

- **Token Turn Marker** is displayed on all tokens of the currently active faction which have not yet had their turn.
  - Turn Markers are not displayed until the encounter is started (by the GM pressing "Begin Encounter").
  - The turn markers are moved to the second faction when all the tokens of the faction going first have had their turn.
  - Combatants which are WAITING do not get a turn marker.
- Allow a **custom skill** to be dragged from an Actor's skill list to the Macro Hotbar.
- Provide **Set Difficulty Number** as an option when setting the DN in the Test Dialog:
  - A new number entry field will appear when this option is selected in the DN selector.
  - Allow a numeric value to be passed in `DNDescriptor` when calling `rollSkillMacro(skill,attribute,interactiveAttack,DNdescriptor)`.
- Add dev files to support intellisense in Visual Studio Code.

## 13.13.3

- Fix issue with capitalization in generated filenames for Possibility token images.

## 13.13.2

- Fix wrong image on French destiny card #5.
- Sort Skills by localized name on SK and Threat sheets (custom skill still appear at the end on Threat sheets).
- Delay creation of `torgeternity` so that the `torgSetupCosms` hook can be hooked on in modules before it is triggered.

## 13.13.1

- Add Drama card details to the French Action deck.
- Renamed internal slug of 'supernnaturalEvil' to the correct spelling of 'supernaturalEvil'

## 13.13.0

- Description field of **Vehicle Add-On Item Sheet** resizes to fit the window.
- #549: **Custom Cosms** are getting closer to being possible:
  - Search for `livingLand` in torgeternity.css, en.json and the *.js files to see what needs customising in your own code.
  - The hook `torgSetupCosms(config)` can be used to modify the available cosms (config contains `CONFIG.torgeternity`)
  - `CONFIG.torgeternity.cosmPossyIcons[cosm]` - full path to icon for scene icons
  - `CONFIG.torgeternity.cosmPossyLargeIcons[cosm]` - full path to icon for Cosm Possibilties dialog
  - You will need to set up the translations and CSS appropriately (e.g. search for livingLand in existing .css and lang/en.json files and copy accordingly)
    - CSS: `#scene-navigation .cosm-card .{cosmname} {background-image: url('path to cosm tent') }`
    - LANG: `torgeternity.cosmDecks.{cosm}`, `torgeternity.cosms.{cosm}`, `torgeternity.cosms.{cosm}PossLink`, `torgeternity.cosms.{cosm}PossLink2`
  - Update game setting `('torgeternity', 'deckSetting')` with your own decks for your own realms (settings.js)
  - Note that when dragging a Threat actor onto the scene, if the the token image path start with `systems/torgeternity/images/characters/threat` then it will get renamed to `threat-{cosm}`

## 13.12.2

- Protect against undefined actor/token in the combat tracker (usually due to tokens where the Actor has been deleted).
- Favourite flag on custom skills is honoured correctly (for Stormknights and Threats).
- Allow Vehicle sheets to be opened again (since they have no skills).
- Put tokens with a neutral disposition at the end of the Combat Tracker (since they are neither Heroes or Villains).

## 13.12.1

- Fix the blank skill names in the Combat and Interaction parts of the skills list.

## 13.12.0

### Enhancements

- Move Torg-specific **Active Effects** fields to their own Tab in the AE Config dialog.
- **Show BD** separately from d20s in the chat result card (with infinity symbol instead of "6").
- Toggle display of **second cosm** in Scene Config window immediately on changing the cosm type.
- Allow **unarmed combat** interaction to be dragged to Macro Hotbar.
- In **Enhanced Display** of Card Hand, put draw buttons at top of window.
- #603: Prevent errors being reported regarding DSN integration and `test.effects` being undefined. (This also fixes Periculum macro.)
- #604: Hold SHIFT when pressing the BD in a chat card to roll the **BD two** separate times and keep the higher result (e.g. Killshot). A superscript-2 is added to the chat title each time that BD is rolled whilst holding SHIFT.
- #605: When **UP** appears on Drama, add a shadow to the UP button to remind players (don't hide UP if not on Drama card).
- #606: Add new **currency** item type, when present they will appear on the Gear tab of the Stormknight actor sheet as a new section at the bottom of the list as well as a summary row across the top.
  - Quantity can be directly edited in the summary row.
  - New game option (Items cost Currency) to allow currency to be spent when dragging Items onto a Stormknight Actor:
    - **No Cost** (default) - cost of the item is ignored, no currency is deducted.
    - **Active Scene** - the currency based on the Cosm of the active scene (in a 'mixed' zone, if the first cosm doesn't have enough currency then the entire price will be paid from the second cosm's currency [if there is enough]).
    - **Player Cosm** - the cosm of the player will determine which currency is used.
    - **Item Cosm** - the cosm of the item being purchased will determine which currency is used.
    - **Ask Player** - the player will be prompted with the Actor's available currencies, so that they can choose which currency to use.
  - Hold down SHIFT while dragging to take the Item for free (without popping up the above dialog).

### Internal Improvements

- Remove explicit cosm names from HBS files.
- Use core drag/drop `draggable` attribute in all sheets.

### Bug Fixes

- Ensure Die Total is retained in skill chat card after adding more modifiers through the Modifiers Dialog.
- Vehicle sheet should scroll properly.
- Post **STYMIED** (not SURGE) message to chat when Stymied appears on Drama card.
- Ensure possibilities are updated on Player's computers when the GM modifiers the possibilities on an Actor.
- **Buff macro** should be working again.

## 13.11.0

- Add dynamic ring textures for all Archetypes.
- **Supernatural Evil** trait has been moved to the "Defense" group in the traits list.
- **Active Effects** on an item can conditionally be applied to the target based on the attack/defense traits (e.g. Holy Water does 12 damage vs Supernatural Evil)
  - `test.damage` as an AE change to modify the inflicted damage.
  - `test.weaponAP` as an AE change to modify the AP of the owning weapon.
  - for Holy Water, set "Apply If Defend Trait" to have the "Supernatural Evil".
  - more capabilities to come later.
- Updated **French translations** provided by @Evensnalgonel.
- Update Archetypes:
  - Use customAttack in preference to specialability-rollable
  - Fix icons for the French archetypes.
- Use LOCALIZATION_PREFIXES in ActiveEffect and Item data models.
  - applyIfAttackTrait
  - applyIfDefendTrait

### Bug Fixes

- Get Active Effect **Transfer on Attack** flag working (as part of making our own Data Model for Active Effects).
- Fix **Cosm Possibilities** dialog working again.
- Fix styling of **journal entries** (especially image subtitles and table headers).
- Prevent double dice rolling with **dice-so-nice** when only a single (or no) target is selected.
- **Possibly Glory** triggered off the final Die total (base roll + UP roll + possibility roll(s) + Hero rolls + Drama rolls).
- Ensure all weapon types are shown on the Gear tab of **Vehicles**.
- Allow perks and custom attacks to be deleted from **Race** Items.

## 13.10.0

- #391: Having **two melee weapons** equipped increase the melee weapon defense of the Actor by 2 (Core pg 126). The change can be seen in the DEFENSES block of the Actor sheet.
- #478: Add optional **Piety score** in the XP block of Stormknights (can be disabled in Game Settings). Update the "Buff" macro to support adding/removing Piety from the currently selected Actors.
- Add **Supernatural Evil** trait which can be set on abilities such as "Undead" (no automated effect yet).
- Change **Custom Skills** to have the Total be calculated from the ADDS on the skill + the chosen attribute on the owning Actor. Custom skill values (not the name) can be edited directly in the skill list on Stormknight sheets.
- A vehicle's operator/gunner skill is now modified by the wounds on the assigned actor.
- A vehicle's operator/gunner skill can be entered manually, for when a GM doesn't want to create actors for a vehicle's crew.
- Reduce internal size of skill test chat message by modifying how apply buttons are selected for display.
- Allow `@Embed[itemuuid]` within Journal pages (and other enriched fields) to show same layout used for "Send to Chat" of the item.

### Bug Fixes

- Fix for the invalid system version in release 13.9.1
- Get vehicle Roll, Chase, Stunt buttons using the correct operator skill.
- Vehicle sheet is immediately updated if a gunner's skill changes.
- Vehicle Defense immmediately updates when a gunner's skill changes.

## 13.9.1

- Don't try to auto-convert a "Rollable Special Ability" with damage into a "custom attack".
- Fix error caused when rolling a BD on an "Unarmed Attack" interaction attack.
- Remove unnecessary deletion of `flags.torgeternity.test` from chatmsg before deleting chatmsg.
- Remove setting `test.parentId` since it is never used.

## 13.9.0 - Concentration, Multi-Action, Soaking

### Improvements

- Change to only offer a Destiny Card for a **Defend Approved Action** if the target is doing an "Active Defense" this round.
- Slight updates to Possibility Selection Dialog.
- **Concentration Checks**
  - Spells/Miracles/Psionics have an additional checkbox `Requires Concentration`
  - Invoking a power with `requires concentration` ticked, and getting a success will automatically add a new active effect to the caster called `Concentrating: <name>` and the Source will also be the name of the effect. The description for the active effect will be `<actorname> is concentrating on <itemtype> '<itemname>'`  (localized accordingly).
  - When using a power-based skill (listed in `CONFIG.torgeternity.concentrationSkills`) or when performing a Concentration check, a modifier will be added to the roll of -2 per 'concentrating' AE currently on the caster.
  - If the caster takes damage (from the Apply Damage chat button) or suffers a Stymied or Vulnerable result from an interaction attack, then a chat message will prompt for the caster to make a Concentration check (and show which is the preferred check: willpower or spirit).
    - If the result of the concentration check is a failure, then a message will be placed into chat indicating which effects are no longer being concentrated on, and those AEs will be removed from the actor.
- **Multi-Action Assistance**
  - Assistance is only provided for combatants within an encounter (using the Combat Tracker).
  - if a Mult-Action Penalty is entered for an actor, the generated bonus for the first die roll will be remembered for subsequent test checks (it will auto-populate the "Bonus: Input Existing" field).
  - The stored bonus will be cleared when the "end-turn" button is pressed, or the GM advances combat to a new round (New/Keep).
  - All saved bonuses are removed when an encounter is deleted.
- **Chat Card**
  - After a **SOAK** roll, and the player has finished modifying the roll, the **Apply Soak** button will modify the original attack card to show the new amount of damage.
  - Only show **buttons** to the players who have permission to use those buttons (so bystanders in the attack won't see buttons).
- Automation for new traits:
  - `Ignore Shock` (Relentless threats) - any calculated shock is ignored.
  - `Ignore Wounds` (Taser weapon) - any calculated wounds is ignored.
  - `dazing` - if at least one wound is inflicted, one of the wounds is converted into 3 shock.
- `Adjust Damage` changed to trigger on SHIFT-clicking the "Apply Damages" button (previously right-click).

### Bug Fixes

- Stop the tabs of the Actor sheet flickering on each update.
- Fix scrolling in Threat and Vehicle sheets (only editing Threat background still has issues).
- Force light theme on the Journal Page editor.

### Known Issues

- Core Foundry Bug (https://github.com/foundryvtt/foundryvtt/issues/13348) prevents filtering Item searches based on traits - fixable with a one-line patch in your core foundry.mjs file

## 13.8.2 - Fixes for Perks, Cosms and Secrets

### Improvements

- Improve generation of Chat Messages.
- Ensure that inline checks have a default of 'standard' (10)
- Ensure **secret** blocks are (not?) rendered properly based on ownership of Actor/Item (including in the Good/Outstanding results posted to Chat)

### Bug Fixes

- Scrollbar will appear when editing the SK Notes section.
- It is possible to create Perks once again (the category will default to "special/homebrew").
- Don't cancel an item's cosm when only a partial update occurs (such as Equipping the item).

## v13.8.1 - Waiting, Status Display, Transfer Weapon/Ammo Effects, Private Rolls

- If the Foundry server is running on HTTPS: then the Torg **Reference** website is opened in a separate tab.
- Automation of **Waiting**:
  - Waiting Combatants are placed at the end of the Combat Tracker.
  - Allow Waiting status to be toggled in the Combat Tracker.
  - Automatically cancel the Waiting status when a combatant's turn ends.
  - Apply the "-2" modifier to any Test Check while an Actor is "waiting".
- Move some hard-coded numbers to their CONST equivalent references.
- Newly-created Threats will have their prototype tokens **NOT linked** to the Actor.
- Remove Initiative options from the Combat Tracker context menus (combat and combatant).
- #369: Add a row of **conditions** at the top of the Effects tab of the Actor sheet (where conditions can be toggled).
- Display **Good** or **Outstanding** text from a power in the chat card on the corresponding result.
- #232: **Transfer Effects** from Item to Target of a test. The effects can remain disabled on the item/weapon/ammo, and they will be enabled upon transfer to the target. (Duration can also be set.)
  - **Apply Effect on Attack** to transfer this effect on a successful attack.
  - **Apply Effect on Outcome** to transfer this effect on a specific test outcome (Mishap,Failure,Standard,Good,Outstanding) - e.g Armor spell
  - A new "Apply effects" button will appear in the chat card which can be used to apply them to the target shown in the chat card.
- Fix styling of **Journal page headers** (force each text page to use the "light" theme).
- **Enrich the Rule text** displayed for the current Drama Card.
- Apply current **roll mode** to skill checks displayed in Chat
  - shade the chat messages according to the roll mode (tinted with default Foundry roll mode colour)
  - Hide dice roll results according to roll mode.
- Get all the language files up to date:
  - Spanish translations by `Teotimus`
  - German translations by `Helmut`
  - French translations by `Durak`

### Bug Fixes

- Ensure that the language keys are read correctly for Defeat Test results.
- Fragile report in Chat Card shows item name, not 'unknown'.
- Only display "Apply Stymied" button for a weapon with Stagger if the attack dealt some shock or wounds.

## v13.7.0 - Glory, Defeat and Intimidation

- #63: If 60+ is rolled on a Test Check, then add a message to the Chat Card indicating "Possible Glory".
- Add button on successful Approved Action to draw a destiny card for the relevant actor/target.
- Click on Image in Chat Message to open the Actor's sheet.
- Several language file updates provided by @Durak-Git
- #569: Hold SHIFT while clicking on the POSSIBILITY button to remove the "minimum 10" on the roll.
- #466: Update **Defeat** handling to display a button to apply the relevant effects, which will prompt for an attribute to modify if relevant.
- Ensure use of Intimidation skill is detected as an Approved Action for Intimidate.
- #416: Allow **Compendium Search** of Items to filter based on cosm, traits, secondaryAxiom, category (incl. Implant Type).
  - (A bug in core Foundry prevents searching within Item fields in the Item sidebar: https://github.com/foundryvtt/foundryvtt/issues/13300 - fixed in Foundry 13.348) (A separate bug https://github.com/foundryvtt/foundryvtt/issues/13348 means that traits can't be searched yet.)
- Display highest size and vulnerable modifier from all the targets in the Skill Test dialog (even though they are applied separately to each target during test resolution).

### Bug Fixes

- An error related to `approvedActions` would sometimes occur when rolling skill checks outside of combat.
- Attacks against Vehicles should work once again.
- Attacks by threats outside of combat works once again.

## v13.6.0 (AMMO, APPROVED ACTIONS, DSR & UP)

### Improvements

- SHIFT key is starting to be used to override certain automations/checks.
- Detect when an **Approved Action** has been performed by a stormknight - add a note to the Chat Card in such cases.
  - Note that an Approved Action won't be detected an attack if you roll from the skills list.
- Only allow the **UP** button to appear when the current Drama Card shows UP for the actor's faction. (This function can be disabled in the game settings.)
- Provide a warning message if the DSR button is pressed and the next step is not approved by the Drama card.
  - This warning can be bypassed by holding SHIFT while clicking on the DSR button.
- Ammunition - weapons remember which ammunition was selected for reloading (ammo name shown in BOLD at top of weapon's ammunition list).
  - Can change the ammunition type on the weapon's Sheet.
  - Add the damage and AP bonus from the loaded ammunition when attacking with that weapon.
- Ensure correct state of "play card" button state when hero is added to/removed from a combat.
- Remove immediate change of scene's cosms, since they shouldn't change until the Save Changes button is pressed.
- DN in `@Check` is now localized if a skill or attribute.
- Display message to player if the "Done" (end turn) button can't find your combatant.
- Remove the heavy shadow from the journal page editor.
- Gear list in Actor sheets
  - Item type removed from end of item name since all items of the same type appear in their own section.
  - Quantity of ammunition shown after the item name.
  - Holding SHIFT when clicking on the `reload` button will NOT reduce the quantity of ammo.

### Bug Fixes

- Allow Stormknight Sheets to reduce width below 750px, so that it can change to single column format.
- Get Periculum macro working (for applying damage via the Macro Hub).
- Don't modify the default threat token when dragging a threat onto a scene where the cosm is set to 'none'.
- Retain the "Damage Type" when importing weapons and actors.

## v13.5.0  (SURGE + DISCONNECTIONS)

### Improvements

- The **Good** and **Outstanding** fields of the powers sheet (Spells, Miracle, Psionic Powers) has been converted to an HTML field, so that inline enrichers such as `@Buff` can be used.
- Item control buttons are in same order on Stats tab and other tabs.
- Rework the `@Check` enricher, so that "dn=" can simply reference the target skill/attribute (without the 'target' prefix).
- Add `CONFIG.debug.torgtest` to provide console output for the Test processing.
- Add `CONFIG.debug.torgtestrender` to provide console output for the Test Reporting.
- Add new `@Damage[]` inline enricher.
  - `@Damage[shock=X|wounds=Y]` inflicts X shock and Y wounds to each selected token (either shock or wounds can be omitted)
  - `@Damage[damage=X]` inflicts X damage to the selected tokens, applying the target's toughness
    - `damage=X` can take some extra parameters:
    - `@Damage[damage=X|traits=fire]` inflicts X damage with the given attack Traits to the selected tokens, applying the target's toughness before calculating shock/wounds (currently the only supported traits are 'painful' and 'stagger')
    - `@Damage[damage=X|ap=Y]` apply Y amount of Armor Piercing when determining shock/wounds.
    - `@Damage[damage=X|ignoreArmor]` ignores the armor rating of the target when determining shock/wounds.
- Provide automation for the **Surge** Drama Conflict Line.
  - Each actor in the combat tracker on that faction's side will be examined for a possible contradiction, and a chat card will prompt with a dice roll for each actor. The 0, 1 or 1-4 cases are based on none, one or both of the following being true:
    - The actor's cosm does not match either of the cosms of the current scene.
    - Any item on the has a higher `Tech Level` (if set) or higher `secondary axiom` than the highest axioms of the cosms of the current scene (only taking 2nd cosm into account in a "mixed" zone).
- Provide automation for detecting **disconnection** during Test Checks.
- When **disconnected**, any items on the Actor which exceed the current scene's axioms will have a line drawn through the item's name (the system doesn't prevent the item from being used).
- A game system setting is available to disable automatically setting the Actor to disconnected on a Surge or Test check disconnection.
- Drama Card Line tooltip shows if current scene is `Standard` or `Dramatic`
- Report a **fragile item breaking** on a Mishap involving its use.

### Bug Fixes

- Popping out the Combat Tracker should show the correctly working drama card line.
- Adding a new Actor to an active Combat should set the correct initiative immediately.
- It is now possible to create **Vehicle** actors again.

## v13.4.0

### IMPORTANT

- Remove Active Effects from Shields that modify the defense (dodge/melee weapons), since that is now automated.
- `@Condition[...]` has been simplified to have just three optional words
  - `@Condition[status]` adds the condition
  - `@Condition[status|off]` removes the condition
  - `@Condition[status|toggle]` toggle the on/off state of the condition
  - `@Condition[status|overlay]` adds the condition and displays it as an overlay
  - `@Condition[status|toggle|overlay]` toggle the on/off state of the condition, and if toggled to the on state then it will be an overlay

### Improvements

- #381: **Auto-apply the shield bonus** to Dodge and Melee Weapon defense (existing AE must be removed from items).
- Apply an equipped **Shield's Minimum Strength**.
- Change vehicle sheet to show **combined dollars+magnitude** field, to match the price field of Items.
- Vehicle sheet defaults to smaller height.
- Restore styling of **macro bar** from V12.x
- Ensure the current selections are visible when the Test Dialog is first opened.
- If a specific image is set during initial Threat creation, then use that image for the token instead of the default.
- Reinstate hiding tabs on Threat sheet when its height goes below 630px.
- **Open Player Hand/Distance Hover** now affect selected tokens for GMs (still controlled Actor's token for players).
- Set hover distance label text color to White, regardless of Foundry's interface light/dark setting.
- **GM Screen** pops out of the window once again.
- Set **combat turn time** to 10 seconds, to advance clock automatically at end of combat Turn.
- **Sort Combatants alphabetically** within their allegiance group.
- **Item Sheets** now automatically size themselves.
- **Distance to Token** label placed ABOVE the top resource bar.
- Add a game system setting to disable core Foundry's **Token Movement History** feature.

Fixes #359, #381, #544
Previously Fixed #195, #326

## v13.3.1

- Items can be created once again.
- "Convert to Rollable" button is working once again, and repositioned in the sheet.
- Suffix for price field now localized (K/M/Md for German, K/M/G for French)

## v13.3.0

### New Features

- #435: Vehicles can now have Heavy Weapons, Missile Weapons and Firearms
  - Drag an Actor onto the Operator or Weapon line of a Vehicle sheet will assign that Actor to that role.
  - The Actor's current skill be displayed in the Vehicle sheet and used for any vehicle weapon attacks.
  - Migrate old Operator and Gunner info by searching for an Actor with the corresponding name.
  - Vehicle weapon attacks use full ability of gunner, such as it being a Favored skill.
  - Weapons/Operator list shows Favoured/Unskilled skills for each crew member.
- Scene Navigation returned to Torg styling.
- Token Ruler grid highlight is coloured according to move/max move of the token (if any).
- Make the `attackWith` field visible in the Melee Weapon, Missile Weapon and Heavy Weapon Item sheets, so that things like Pain Gauntlet can be built directly as a Melee Weapon rather than a Gear item with a separate customAttack item.
- Expand list of traits to cover the cosm books, and force all Item types to use the drop-down list.
- #551: Convert `Rollable Special Ability` to `Custom Attack` if it has an attack-with skill and non-zero damage.
- #563: The **Rule on a Drama Card** can be entered in the Card Editor, and it will be displayed in the Combat Tracker.
- #567: Item traits appear in the expanded view of gear list on Actor sheets.
- Having **OBSERVER** ownership of an Actor disables most actions on the Actor Sheet.
- Allow multiple skills/attributes in a single Check, such as `@Check[willpower,spirit]` which will get expanded to two buttons
separated by a space - skill and attribute names will be displayed with the localized label.

### Bug Fixes

- Combat Tracker no longer disappears when a card Hand is deleted (which would occur when an Actor is deleted).
- #565: No errors during hover distance.
- Use common code for performing Attack/Power rolls from the Actor sheet and from `rollItemMacro`.
- When rolling Reality skill from Actor sheet, remove `disconnected` state if the Reconnection is successful.
- Change background colour of hover distance function to distinguish it from the waypoint display during turns.
- When Threat window is closed while Notes tab is selected, on reopening the Notes tab will be shown correctly.
- Reduce flickering of Combat Tracker on "New" round.
- Create Actor/Item dialogs now have translated Types again.
- Get **item delete** buttons working in the Threat and Vehicle sheets.
- Remove 'core' Foundry Card and Card Stack sheets.
- Add **custom skills** to Threats, allowing them to be edited on the Perks tab.
- Add ability to directly **create items on Actor sheets**.
- Discard unsupported Item Traits at startup (console log message for each trait removed).
- Ensure Item Sheet updates automatically when the item's data changes.
- Replace `render(true)` with `render({ force: true})` (V13 update).
- Allow **Active Effects** to be dragged between Actors and Items again.
- Vehicle and Threat sheets should scroll better.
- Defeat test greys out the higher stat (of Spirit or Strength), but the button can still be pressed (in case the Actor has an ability that allows them to modify the "lower of" rule)
- Entering a price for an Item that ends with K/M/B (for English, your localized version if de/fr/es) will calculate the correct torg value cost.

## v13.2.2

- Ensure that the **Possibility/Up/Hero/Drama/+3** buttons add to the bonus properly.
- Prevent crash of Combat Tracker when actor for a combatant has been deleted.
- Chat messages for Drama conditions show proper text instead of `{faction}`.
- Don't create a new 'Active Drama Card' deck every time that 'Setup the Cards Directory' is used.
- Extra protection to prevent errors if card decks don't exist.
- Prevent error from BD button when chat card has no target.

## v13.2.1

- Fix an issue with the Combat Tracker generating errors with unsupported cards.

## v13.2.0

### Improvements

- For GMs, the default Actor type is now "threat" (for players, it remains "stormknight").
- Rework Check Dialog to make selected options appear clearer.
  - New layout, with actual modifier shown in tooltip rather than permanently on display.
  - Modifiers in chat tooltip are sorted alphabetically
- When changing an Actor's portrait, if the old portrait matches the token image then the token image
is replaced by the new portrait. (For unlinked Actors, this will directly affect the displayed token.)
- #336: Add a field to add **traits** to Items - at the moment only a predefined list of traits is available.
  - **'painful'** trait will add +1 shock if any damage is caused.
  - **'stagger'** trait will display button to apply Stymied to target if any damage is caused.
  - **'unwieldy'** trait will display button to apply Vulnerable to attacker on a miss.
  - **'trademark'** trait will auto-set the "Trademark Weapon" button in the Test Dialog.
- #162: Allow cosms to be marked as unused in the Deck Configuration window.
  - Cosm decks marked as not available will not be available in the "Draw Cosm Card" dialog.
- #296: First iteration of supporting the **Conflict Line of Drama Cards**, providing buttons in the Combat Tracker. Pressing the presented button will put a message into chat about the effect, and in the following cases will perform the appropriate action:
  - **Inspiration** - immediately recovers 2 shock for each actor on that faction's side.
  - **Confused** - disables the Play button in card Hands (until the end of the round).
  - **Fatigued** - when each player ends their turn (or GM presses end-turn-tick on the combatant) the character suffers their fatigue.
  - **Stymied** - all actors on that faction's side are immediately given the Stymied (stacking) effect.
  - **Other Options** - No automation supplied (or not easily possible).
- Drawing a Drama Card will auto-sort the combatants based on the new card and the Standard/Dramatic setting.
- Drama Deck can be shuffled from the Combat Tracker's context menu (three dots to the right of the Round counter).
- Combat Context Menu option to recall previous Drama Card.
- `rollSkillMacro` now returns a Promise which can be awaited, and the result can be found in `result.flags.torgeternity.test.resultText` (when `result` is the return value from the Promise)
- All occurrences of `TestDialog.asPromise` have been renamed to `TestDialog.wait` (and is used exclusively throughout the code now).

### Bug Fixes

- It is possible to edit the text numeric value of the attributes of Threats.
- Effects can be deleted on embedded Items once again.
- Threat sheet can be scrolled again.
- Hide foreign language compendiums properly.
- Skill Checks should use Numbers properly, rather than doing string concatenation.
- Fix issue with hovering over tokens.
- Prevent error in Card Deck Configuration when player has no hand assigned.
- Allow drag/drop of cards from Decks to Hands.
- Only hide foreign language compendiums on first render, so they don't disappear as soon as they are created.

### Translations

- New translations required, in particular for the new "traits" section.

## v13.1.2

### Improvements

- #543: Hovering over a token shows the distance from your controlled token to that token (game setting).
- Further optimisations to TestDialog.
- Adding/Deleting/Changing the race of a stormknight should work properly now.
- Add **`@Condition[status]`** to apply a new effect to the selected actors (or the player's controlled actor). One or more options can be added to the condition, such as:
  - `@Condition[status|overlay]` will set the status as overlay,
  - `@Condition[status|toggle]` will toggle the current state of that status on the token,
  - `@Condition[status|off]` will remove the status if it is on the token.
  - `stymied` and `vulnerable` will promote an existing condition to `veryStymied` or `veryVulnerable`.
- Add **`@Buff[stat1=num|stat2=num]`** to buff/debuff attributes and skills:
  - Set `stat` to the name of the attribute of ability (either the key [strength] or the localized string).
  - Set `num` to either a fixed value to replace the actor's current value, or a `+X` or `-X` to modify the existing value.
  - Adding `|duration=x` can set the duration of the effect to x turns/rounds (x = number)
  - Other fields in the ActiveEffect can be overridden such as the following which will set the active effect to have a barrel icon:
    - `@Buff[strength=+2|img=icons/svg/barrel.svg]`

### Bug Fixes

- #534: **Compact SK sheet** working again
- #535: Active Effects toggle and delete buttons honour editable state of the effect.
- #536: Compact SK sheet view is working again.
- #537: **NaN damage** appeared when rolling from dragged weapon attack.
- #538: Remove blank lines at bottom of Power details.
- #539: No **broken image links** for Cyberwitch or Scrapper on case-sensitive servers.
- Adds back the **Racial Perks** tab to the Race Item sheet.
- Allow cosm to be changed on Stormknights.

## v13.1.1

- Fixes the **aimed** option not working in Tests.
- Remove **autoDefeat entry** from game settings.
- Allow **Create Effects** to work.
- Fix dice rolling when **Unique DN** is selected in Game Settings.
- Use better method to **hide Compendiums**.
- Don't hide the **playlists**!
- Get Card Deck **+ Add** button working.
- Attempt better migration of **cosm** field of Items.
- Fix display issues with **Card Deck Configuration** window.
- Move **Actor left tab** slightly further away from window contents.
- Fix some **localization** issues.
- UI Controls, the **torg button states** reflect currently open windows.
- **Target Vulnerability** displayed in Test Dialog Status Effects panel.

## v13.1.0

### New Features
- Handle **shock and wounds** in a consistent manner, regardless of the source of the change.
- Show **Enhancements** on the Perks tab of the SK sheet.
- New system options (default enabled) to:
  - Automatically set threats/stormknights to **Unconscious (KO)** whenever their shock is exceeded.
  - Automatically set threats/vehicles to **Dead** whenever their wounds are exceeded.
- Displays a Chat Prompt to **check for Defeat** when a stormknight's max wounds are exceeded.
- **Inline Checks** can be added to journals, and those checks can also be posted to chat by GMs to provide a clickable links for players.
  - The checks take the form `@Check[persuasion|dn=18]` or `@Check[taunt|dn=standard]{Taunt}` (the `{...}` label is optional), or any other sort of test using a slightly more complex syntax, such as the following which shows all the parameters that are normally passed to TestDialog (the first word is always the testType):
  - `@Check[interactionAttack|skillName=intimidation|dn=targetIntimidation|unskilledUse=true]`

### Other changes
- **Active Effects** can be edited on Items which are present on Actors.
- Show **all effects** on the Actor sheets, including effects from owned Items.
- Enforce `cosm` as a mandatory field (`none` is the default) and use `{{formInput}}` for it on all sheets.
- Lots of refactoring of code (to make further improvements easier).
- Toggling **Hide Foreign Compendiums** is more efficient and no longer requires a Foundry reload.
- Provide basic integration for **Automated Animations**.
- Only store ItemId in test, not the full test object.
- Include **Item Name** in test result.
- Show Test Type in the **Test Dialog window title**.

### Bug Fixes

- #520 Player List now displayed when on GM is logged in
- #521 for French language status markers
- #522 Equipping armour did not unequip other armour
- #523 Toggling equipped gear would jump scroll to start of list
- #524 to get correct colour in list banners
- #525 Dragon Warrior had too many buffs to Strength
- #526 Get "Show Details in Checks" working
- #527 Provide compatibility with Automated Animations
- It is now possible to edit Threat skills again

## v13.0.4

- No errors when used with Dice So Nice!
- Card Editor Dialog should use the correct template on Forge.

## v13.0.3

### New Features
- **Token Ruler** changes walk icon to running when >move and warning when >3*move
- Allow **Welcome message** to be shown at any time by calling `game.torgeternity.showWelcomeMessage()`
- New game system option to **suppress extra chat messages** generated by core Foundry where TE provides its own message.

### Other Updates
- (#511) **Dragging** items and skills to the Hotbar should now create the relevant macro.
- Configure key now closes PossibilityByCosm if it is already open.
- Reinstate **compact** form of Stormknight sheet when the window is narrow.
- Add **text styles** to the ProseMirror editor (matching those available in TinyMCE).
- Game system should work properly on the Forge and other sites that have a prefix in their URL.
- Test **Modifier tooltip** displays a vertical list of modifiers.
- Fix creation of Interaction test **macros**.
- (#508) Allow **editting Portraits** of Actors and Items by their owner.
- (#509) Ensure that an All-Out attack will give the attacker the **Very Vulnerable** effect.
- The links in the **Welcome Message** now work again (opening the relevant compendium).
- **+/- buttons** on Perk Enhancements and Limitations are now visible (in white text)
- **Active Effects** can now be created on Actor and Item sheets.
- Don't highlight entire **skill section** on hover.
- (#514) Hide console message about no default hand for actor

### Internal Changes

- Refactored Skill Test to reduce size of ChatMessage record.
- Item sheets collected under templates/items

## v13.0.1

- Combat Tracker: Cards, Effects, Tracked Resource (optional).
- (#510) Combat Tracker: Hovering over a combatant changes background (as per Core).
- Combat Tracker: add core buttons for Toggle Visibility, Ping Combatant, Pan to Combatant (Player only).
- Dark Mode: Tabs don't disappear if Foundry is set to use Dark Mode.
- Dark mode: Torg Eternity dialogs/sheets should be displayed properly.
- Journals: Force light mode onto Journal Text Page editor.

### Fixes

- https://github.com/gmmatt/torgeternity/issues/456
- https://github.com/gmmatt/torgeternity/issues/499
- https://github.com/gmmatt/torgeternity/issues/500
- Possibly https://github.com/gmmatt/torgeternity/issues/501  ?
- https://github.com/gmmatt/torgeternity/issues/504
- https://github.com/gmmatt/torgeternity/issues/505

## v.13.0.0

- v13 compatibility- open Beta!
- Foundry v13 compatible version.
- Converted all relevant classes to use AppV2.
- Removed System styling from the core dialogs.
  
- Now option to surpress chat notifications on card shuffle.
- Miracles now have the skill "Faith" selected on creation.
- custom attacks are now possible on threats [471](https://github.com/gmmatt/torgeternity/issues/471)
- A new macro that deals damage to targeted tokens [472](https://github.com/gmmatt/torgeternity/issues/472)
- Giving an option to ignore ammo mechanics [#490](https://github.com/gmmatt/torgeternity/issues/490)
- Implants now do have a secondary axiom as well [#487](https://github.com/gmmatt/torgeternity/issues/487)
- Item price-values are now completely automatically calculated [#486](https://github.com/gmmatt/torgeternity/issues/486)
- Nice new possiblity token images [#495](https://github.com/gmmatt/torgeternity/issues/495)
- Shiny new Welcome Messages [#496](https://github.com/gmmatt/torgeternity/issues/496)

## v.12.3.9

- Squished a bug (call stack exception) that occured in Chrome
- Correction of Skill Macro use with custom difficulty

## v.12.3.8

- Correction on CSS Splotches in journals

## v.12.3.7

- Correcting splotches

## v.12.3.6

- Bugfixing

## v.12.3.5

- More bugfixing

## v.12.3.4

- Fixing a bug that prevented dropping perks on actors

## v.12.3.3

- Fixing a bug that fetched attribute maximum for all actor types, though it may take only these for storm knights.
- Fixed the assignment of newly made vehicle avatar & token

## v.12.3.2

- Fixing some standard item-icons related things [#483](https://github.com/gmmatt/torgeternity/issues/483)

## v.12.3.1

- Fixing a bug that didn't order the cards inside a deck (just on the interface (app), not the cards themself).

## v. 12.3.0

- Active Defense will now automatically be disposed, when the combat round is over or the combat ends. [#438](https://github.com/gmmatt/torgeternity/issues/438)
- Character informations can now be shown by a right-click-context-menu on an actor. [#229](https://github.com/gmmatt/torgeternity/issues/229)
- Option for not automatically untarged token after attack [#459](https://github.com/gmmatt/torgeternity/issues/459)
- refactoring the handlebarHelpers [#455](https://github.com/gmmatt/torgeternity/issues/455)
- The buff macro now handles more than 1 selected token (especially good for gms!) [#468](https://github.com/gmmatt/torgeternity/issues/468)
- New token frames! These will be used in modules and our archetypes here.
- Ammo will not be deleted after it's value reached 0, but will not be used unless there are bullits in the clip! [#428](https://github.com/gmmatt/torgeternity/issues/428)
- Old PNG and JPEG files were deleted to reduce the amount of data the system is using (they were replaced by .webp images way before) [#457](https://github.com/gmmatt/torgeternity/issues/457)
- The prerequisites of a perk is now a textarea and not longer a textfield (this makes it possible to increase size and having a better overview) [#254](https://github.com/gmmatt/torgeternity/issues/254)
- Races are now as items and can be dragged onto the character. This influences the attribute maximums and adds race-related perks. [#52](https://github.com/gmmatt/torgeternity/issues/52)
- Option for using Pan-Pacifica tabletents after year 1 [#467](https://github.com/gmmatt/torgeternity/issues/467)

## v. 12.2.8

- Fixing a bug on active defense.

## v. 12.2.7

- Determined a bug that concerned attacking vehicles [#470](https://github.com/gmmatt/torgeternity/issues/470)

## v. 12.2.6

- Introducing perk category _legend_ [#463](https://github.com/gmmatt/torgeternity/issues/463)
- Threats do now show ammunitions as well

## v. 12.2.5

- The _"View 1-3 drama cards"_ got a little change to check if there's a combat running or not- now, it checks if the viewed combat is running (in case of multiple combats) [#464](https://github.com/gmmatt/torgeternity/issues/464)

## v. 12.2.4

- Corrected a bug that substracted a possibility on a soak roll twice.

## v. 12.2.3

- Added optional chaining in updateCombatant, for a .world property might not be accessible [#448](https://github.com/gmmatt/torgeternity/issues/448)
- Restored selectOptions of maneuver and intimidation defenseOnly on threat character sheet (wonder where this got lost) [#445](https://github.com/gmmatt/torgeternity/issues/445)
- Corrected some wierd things on cosm entry of items, that didn't store correctly [#447](https://github.com/gmmatt/torgeternity/issues/447)
- missplaced gear in vehicles are fixed [#452](https://github.com/gmmatt/torgeternity/issues/452)

## v. 12.2.2

- Added ammunition handling to vehicles (and some other item handling)
- More migrations for active effects (values of _True_ won't be handled)
- Item drop on vehicles were somewhat messy

## v. 12.2.1

- With the new hook on end of turn in ct, active defense was deleted as well. Squished that (it's about the end of the round, this will be part of 12.3.0)
- Migration for active effects that set isFav to 1 (it's boolean now) [#439](https://github.com/gmmatt/torgeternity/issues/439)

## v. 12.2.0

- Ammunition is now handled. The value of a weapon with ammo is now reduced according to the amount of bullets a shot takes (i.e. burst shots). A weapon can now be equipped with a general gear item like an _Ammo Belt_ that will be consumed if you click the reload button on the weapon. [#36](https://github.com/gmmatt/torgeternity/issues/36). Please be aware that the values in the ammunition item don't have any effects _yet_, as this is an [issue](https://github.com/gmmatt/torgeternity/issues/428) for later.
  - On this cause we've thrown the BD button on each item out. It was a relic from the old days that is no longer needed because of the handling by chat cards.
- A secondary axiom is now selectable on most items [#46](https://github.com/gmmatt/torgeternity/issues/46)
- Weapons do now have a minimum strength value, that is computed alongside minStr of armor items. [#116](https://github.com/gmmatt/torgeternity/issues/116)
- Alphabetical sorting of HTML select & options tag [#160](https://github.com/gmmatt/torgeternity/issues/160)
- It is now possible to drag & drop "non-vehicle-actors" on vehicles to set the actor as the driver of the vehicle (with all values).
- By clicking on the "Done" button as a player during a combat in the combat tracker, active effects are now handled and taken off automaticaly. Threats can be treated in the same way if you're ticking the checkmark in the combat tracker as the gm!
- New macro for showing the next 1-3 cards per chat whisper to player(s)
- New macro for getting back the previous drama card (in case if the player plays a "Seize initiative" card when you've picked already a new drama card)
- New macro to give a player the **last** played card back.
- A new buff macro that will easily choose an effect, that will be applied to your character for a specific amount of rounds.
  (All of the above concerned issue [#351](https://github.com/gmmatt/torgeternity/issues/351))
- Bug quishing and style issues:
  - Fixed the archetypes' missile weapon category
  - used async enrichment for description fields [#429](https://github.com/gmmatt/torgeternity/issues/429)
  - Moved the hover pooled card in combat tracker out to the left edge that might give a better view on the combat tracker itself [[#131](https://github.com/gmmatt/torgeternity/issues/131)]
  - Relocated where minStr and maxDex are stored to keep the partysheet clean [#433](https://github.com/gmmatt/torgeternity/issues/433)
  - Clicking the dice images in a chatcard no longer hides them [#433](https://github.com/gmmatt/torgeternity/issues/334)
  - Corrected a classhandling with foundry form fields [#436](https://github.com/gmmatt/torgeternity/issues/436)

## v. 12.1.4

- Fixing a bug where the damage of powers weren't processed correctly

## v. 12.1.3

- Fixing a bug where rollable specialities weren't processed correctly

## v. 12.1.2

- Fixing spent possibilities on a soak that should only be spent _after_ the roll [#421](https://github.com/gmmatt/torgeternity/issues/421)
- A new option has been added to determine whether the details of the chat cards should be automatically expanded or not. [#420](https://github.com/gmmatt/torgeternity/issues/420)
- Bug squishing and style issues:
  - In fatigue macro, there was some wierd thing going on with the Math.max method, so changed this. [#425](https://github.com/gmmatt/torgeternity/issues/425)
  - For powers, the result of BDs were concated instead of added. Happend that test.damage was a string in this case. [#426](https://github.com/gmmatt/torgeternity/issues/426)

## v. 12.1.1

- Hotfix for custom skills. These should work again. In their own special treatment ;)

## v. 12.1.0

- v12 compatibility is here! From now on, the system follows the foundry version in it's _major_ part of the version number.
- Broken links are no longer ugly placeholders, but a glowing effect on hovering remains to signal that there should be something there [#382](https://github.com/gmmatt/torgeternity/issues/382)
- It is now possible to roll BDs and add damage in advance, using the dialog window [#123](https://github.com/gmmatt/torgeternity/issues/123). From this work followed:
  - Reorganized the roll dialog, something prettier
  - Chatcards now show the sum of damage from BDs in the details (if applicable)
- Solved bugs and style issues:
  - BDs on powers weren't shown on a chat card [#406](https://github.com/gmmatt/torgeternity/issues/406)
  - More rolls are asynchronous (as it should've been since a long time and needed for V12)
  - Upstyling of the combat tracker

## v. 3.8.1

- Migration-correction
- Fixed minDex maxStr check by SKs/ Threats

## v. 3.8.0

- Better migrations for active defense, that were active in existing worlds
- Style-rearrangement on perk item, prerequisites are now on a more comfortable place [#158](https://github.com/gmmatt/torgeternity/issues/158)
- 'Find' is now available as DN for stealthy tests [#387](https://github.com/gmmatt/torgeternity/issues/387)
- Perks now have the "Ground Sloth" & "Special / Homebrew" categories for your own needs, and adding a new box for general contradictions that will be displayed in the chat cards [#389](https://github.com/gmmatt/torgeternity/issues/389)
- Chat cards do have now enriched HTML, as well as item descriptions in character's gear [#386](https://github.com/gmmatt/torgeternity/pull/386)
- Stymied & vulnerable effects do now have a duration.
- Chatcards now will offer backlashes and headaches in case of a failed power test. [#392](https://github.com/gmmatt/torgeternity/issues/392)
- On Roll-dialogues, if a bonus number is entered into the previous roll field, the 'Input existing' radio button will now be automatically checked to support gameflow. [#384](https://github.com/gmmatt/torgeternity/issues/384)
- By RAW, the DN on a multi target attack is the highest DN. This is now implemented- as well as an option to toggle that off for houserule purposses (as it was implemented until now).
- Processing now attributes no longer with `system.attributes.[attribute]`, but with `system.attributes.[attribute].base` (please **never** use this for change-purposses) and `system.attributes.[attribute].value` (this is the one you want to use). This ensures a safer handling with attribute scores that should not be affecting the ground value of the attribute. Therefore, the attributes now can only be altered by clicking the "Edit" button in the attribute fields. In case you're confused: The values of the fields are changing to their base value, not their current, modified value (if applicable).
- Bug- and stylefixes:
  - Style-Fix for vehicle addon item [#383](https://github.com/gmmatt/torgeternity/issues/383)
  - Style-fix on general Chat-Cards holding item informations [#208](https://github.com/gmmatt/torgeternity/issues/208)
  - Corrections on DataModels
  - The equipped item now shows colour again
  - Size of characters are fixed
  - Recovered TinyMCE CSS File that got lost on the way
  - Not really a fix, but updated all item editor fields to ProseMirror engine, because TinyMCE won't work anymore correctly and isn't supported anymore
  - Rerolls are now asynchronous, as synchronous rolls are decapricated in V12

## v. 3.7.2

- Due to forge, this release was made because of their cashing problems with 3.7.1. There were no changes made whatsoever.

## v. 3.7.1

- New version because release-pipeline didn't work- no changes in the system.

## v. 3.7.0

- A lot of code-cleanup, refactoring and overdoing
- Changing old templates to new DataModels
- Included new Macros- Compendium with preset macros, hoping to provide your gameflow. More are to come.
- Changed FR localisation for display-reasons
- Chat messages are now rendered on client-side. So settings, specially for chat messages, are now individual to each user's settings
- Skill-Values of threats are now processed on other terms. Besides that, you can add skills or take them away from the access list by clicking them
- Disconnect-status has now impact: As long as you're disconnected, it will not be possible to roll on "reality" - except for reconnetion, of course
- The armor-item now derives directly from all the given values (bonus, fatigue). Active effects are no longer necessary. MinStr/MaxDex should work as well and intended. More item-related natural handling will come around in near future.
- Some Style-corrections for Firefox-Browser
- Vehicles have some additional fields for armor rating. This is an interim solution for further Toughness/Armor handling. Please be aware that you need to deactivate any active effects if you want to change these ratings by hand.
- Card-Handling by GMs will now by private chat cards
- Some redoing of the threat sheet. 'Run' will now be displayed too

## v. 3.6.1

- Fixing a browser-based bug where Possibilities weren't correctly parsed into a number
- Images now won't change into the default images once they're changed

## v. 3.6.0

- Resolved a bug where dice-so-nice-rendered dices were only shown to the player- now everyone sees them
- Resolved a bug, where active effects were not correctly applied to threats
- Since the last Google Chrome-Update, scrollbars were shown inside Actor SKs boxes.
- Styling-Issues solved
- By creating an item and threat, it will have the proper default image (and token)
- Threats can now roll skills unskilled
- Storm Knights and vehicles now have a possibility to change the size

## v. 3.5.0

- Drama cards now will be shown although no combatants are joint in the combat tracker (aids simple DSR mechanics).
- Multi-Targeting now has it's own technique: You'll get a seperate chat card for each target. These will be updated if you'll apply a possibility/drama/herocard and so on. BDs have to be rolled for each target though.
- After an interaction-attack, it will now be possible to apply stymied / vulnerable directly by the chat card. Please click the button twice if the status is "very..."
- Damage and (the new) effects will now be applied to the appropriate token, even if not (any more) targeted.
- Speaking about chat cards, we heared you! They're much prettier now.
  - There is an option to toggle the color of the result in chat-cards for colorblind people. These alternative colors were tested with someone who has a red-green-weakness.
  - Please be aware of the option toggling Torg-Like dice in chat cards (or keep 'em grey like they are on standard).
- Attacker will now get the "Very vulnerable" status if an all-out attack is done.

## v. 3.4.0

- Vehicle defenses are now correct
- Vehicle weapons can be used again
- Being vulnerable now giving no longer bonuses for soak tests
- Skills on threats are no longer disordered after changing a value
- On automatic damage appliance, shock must exceed the character's shock maximum to set him KO (prevously it was on point).
- The amount of rolled BDs will now be shown as a figure
- Actor portraits preserve their quadratic ratio if more text is added to the chat card
- As soon as a GM starts a world, all cards in stacks and hands will turn automatically to face up. This will prevent problems in card handling.
- **HIGHLIGHT:** New option on attack dialogue for trademark weapon's (and similiar) mechanic.

## v. 3.3.0

- If a Storm Knight is deleted, the appropriate hand will be deleted as well.
- The combat tracker now behaves like it should for TE: All players now have the "Done" button displayed. If a player
  clicks it, the GM's combat tracker will be updated with a checked checkmark at the apropriate character. However, to
  end the round is totally up to the GM.
- New possibilities by cosm window! Click on "Possibilities" on your character sheet, a new window will open to help
  keeping you track of cosm-specific possibilities. Players can hit the key "P", as this bound for opening this window
  as well. If the apropriate premium module is active, clicking the title of the cosm-possibility will open the journal
  entry for quick rule reference. **PLEASE NOTE:** This won't have any impact on the system's behaviour, it's just for
  your convenience for accounting purposses.
- The skill "Missile Weapon" is now correctly ordered in the combat section.
- Storm Knights can actively defense- so why can't threats? Now, threats as well can defend themself actively.

## v. 3.2.2

- Fixing a bug, that set the possibilities automatically on 3 when 0 is reached.

## v. 3.2.1

- introducing system.other.moveMod and system.other.runMod as new Dataelements for active effects on move and run (check
  out the [wiki](https://github.com/gmmatt/torgeternity/wiki/SK-Data-elements-after-3.0.4) as well)
- Fixing vehicles for possibility spendage (the one who clicked is the one who pays ;) )
- Scene configuration is up to date with all the elements you know from other systems

## v. 3.2.0

- A new Wiki with data elements is found
  [here](https://github.com/gmmatt/torgeternity/wiki/SK-Data-elements-after-3.0.4)
- Possibility handling!
  - When "Possibility" is clicked on the chat card, the amount now is substracted from the aproprieate character
  - A possibility now is removed on a soak roll
  - If you are about to spend your last possibility, you're asked if you're really sure about that. At last, you could
    need it otherwise...
  - A warning is now produced, if there are no possibilities left
  - However, if a GM wants to grand you a possibility (there are moments, when heroes are needed!), the GM can click on
    "Possibility" on your chat card to produce a possibility roll
- The law of action!
  - If on a scene are the cosms "None", "Other" or "Nile Empire" set, the mechanics for the law of action are principle
    possible to trigger. This means that you can click on "Possibility" twice, and the best result is chosen. We decided
    to take the "None" and "Other" cosm choice to be placed in this mechanics as well for GMs who are more playing a
    theatre of mind or don't want to configure cosms on their scenes.
- CusomSkills are now "favorable".
- Default defence detection now takes place, so by attacking with Melee or Unarmed, the default defence will search for
  a melee weapon equipped by the defender. If there is none, well, it's up to unarmed!
- The party sheet can now be opened in 2 modes: Either you'll be shown all your players, or just these who are online.
  You'll be asked for a "yes" or "no" decission.

## v. 3.1.3

- Bug Squashing:
  - If the current wounds value is empty, it needs to be checked as well, setting the modifier to 0 (#280)
  - Getting power's DN from the item DN combobox if there's no target selected (#82)
  - Resolving the scrolling issue with an docked-in combat tracker (#271)
- Setting Skill list entries to a min-height of 25px (necessary for custom skills)
- New splash

## v. 3.1.2

- Fixed a bug where wounds gave negative modificators in their amount, though it can't be more as -3
- Gave the journal compendiums some rethinking.
- Changed item's avatar pictures
- took out the .lock file from the .zip file

## v. 3.1.1

- Fixed broken compendiums after merge / release

## v. 3.1.0

- Included a new damage handling on chatcards (thanks to Durak)
- More localisation

## v. 3.0.1

- Update internal databases
- Add ES functionality to hide compendiums option - now ES hides DE and FR compendiums, but EN is still available

## v. 3.0.0

- New NPC sheet!
- You can now use interaction attacks from NPC sheet
- You can specify interaction skills as defensive only
- To edit, hit the edit button the Skills section
- Fixed problem with stymied and vulnerable conditions not applying (thanks Durak!)
- Effects applying to attributes now alter corresponding skills as well (thanks again Durak!)

## v. 2.9.3

- Fixed issue where skills and attacks couldn't be rolled from unlinked tokens in v11
- Cards are removed from player pools when GM ends combat encounter
- Fixed issue where Torg icon was not aligning in left custom menu
- Many thanks to Durak who was mostly responsible for the changes in this patch!
- Removed option for animated chat cards - it was causing formatting issues in some system installations.

## v. 2.9.2

- Fixed issue where "Hide Foreign Compendium" setting was broken (thanks for the help Durak!)

## v. 2.9.1

- Version 11 compatibility!
- Fixed problem in 2.9.0 with database compatibility
- Fixed display issue on vehicles in version 11
- Update scene navigation for version 11 (many thanks to @mxzf on the Foundry Discord for assistance with this issue, as
  well as the system migration issue)
- Migrate system databases to v11
- Repaired Destiny Card 42 (en)
- Updated magic axiom for new Cyberpapacy characters (15 to 14)
- Updated alignment issue for custom skills
- Add warning for users of automatic damage feature
- Eliminate obsolete compatibility warnings
- Updates to de.json (thanks Algor!)
- Update pilot section (Algor)
- Updates to journal (Algor)

## v. 2.8.3

- An option now allows player hands to open at the bottom/right of the screen. When this option is checked, cards appear
  above the player hand window.

## v. 2.8.2

- Updated Destiny Card 42 (EN) so that it is correctly named
- Updated magic axiom for Cyberpapacy characters from 15 to 14
- Corrected an alignment issue for custom skills
- Added warning re automatic damage feature not correctly applying subsequent BD rolls

## v. 2.8.1

- Fixed issue involving inability to target threat skills

## v. 2.8.0

- Added new actor template for vehicles

## v. 2.7.2

- Fixed issue involving resetting possibilities in player list
- Formatting updates test chat output
- Cards should now remain pooled when passed to other players
- Additional options for hiding official compendiums

## v. 2.7.1

- Fixed issue where foreign compendiums would not hide when using the Compendium Folders module
- More automation for shield users - toughness bonus now automatically increased when actively defending (thanks Durak!)
- The player sheet is back! (Thanks, Rwan!)

## v. 2.7.0

- Fixed multiple compatibility warnings

## v. 2.6.9

- Fixed issue where tooltips for cards in chat were broken
- Multiple localization improvements
- Drag n Drop Macros for Threats (Thanks Spatula!)
- Enriched text now available on all items and actors

## v. 2.6.8

- Fixed issue causing buff effects on attributes to fail to reset on close.
- Fixed issue where threats could not be edited
- Multiple updates to item and actor sheets to ensure compatibility with version 10
- Armor/shield equip/unequip icon on Gear page now turns associated Effects on/off
- Fixed issue where chat hyperlinks did not work when actively defending

## v. 2.6.7

- Fixed issue where some fields on threats could not be edited

## v. 2.6.6

- Fixed issue where Storm Knight attribute edits didn't stick
- More chat and hotbar enhancements from Spatula!

## v. 2.6.5

- Fixed issue in 2.6.4 where drop-downs did not work in item sheets
- Fixed issue where chat message displaying item description was not working
- Drag n Drop macros are back, baby! Many thanks to Spatula for helping us get them going again in v10!

## v. 2.6.4

- Fixed issue where scene backgrounds could not be created/changed
- Fixed issue where enriched text does not appear in some item descriptions
- Fixed issue where macros could not be dragged onto hotbar or rearranged
- Note: Torg Eternity drag/drop macros from character sheet are disabled. We hope to restore them in the future.
- Disabled custom player list extension until it can be updated for v10

## v. 2.6.1, 2.6.2, and 2.63

- Changed verified version to hopefully improve Forge compatibility
- Changed "name" to "id" in manifest to improve Forge compatibility

## v. 2.6.0

- Our first release under Foundry, version 10!
- A handful of updates, but most of the changes relate to v10 compability
- You will get some v10 compatibility warnings in the console. These will be resolved in the coming weeks.

## v. 2.5.1

- Fixed issue with card images in system (thanks BadIdeasBureau!)
- Updated archetypes (known issue: archetype powers still not updated to new data structure) (thanks Helmut/Algor!)
- Added French compendiums (thanks Rwan!)
- Added new perk categories from Orrorsh and Pan Pacifica books
- Renamed "Ki Powers" to "Vitality" per Pan Pacifica backer preview

## v. 2.5.0

- From Durak: When rolling for active defenses, an Active Effect is created that modifies those defenses.
- Substantial overhaul of skill check system. The system is now streamlined to create a consistent skill test
  experience. No need to shift-click to get test to account for targets.
- Attack-type powers now work as attacks versus targets, and calculate damage.
- Powers are now listed below attacks on main page of character sheet
- We have migrated all card images to webp format. Thanks to BadIdeasBureau your custom decks that rely on images in the
  core system or published modules should also migrate to the new format.

## v. 2.4.4

- Fixed bug that prevented entry of threat data

## v. 2.4.3

- Fixed issue with defenses improperly calculating on sheet and in attacks
- Updated sheet styling so that expandable skills do not change size of other sheet elements.

## v. 2.4.2

- Fixed bug where defenses were not calculated in 2.4.1
- User experience with cards improved even more thanks to BadIdeasBureau
- More French localization goodness, thanks to Rwan

## v. 2.4.1

- Card settings and world setup working much smoother now thanks to Rwan and BadIdeasBureau.
- Under the hood, deck identifications are getting handled much more elegantly thanks to BadIdeasBureau.
- Also thanks to Bad, we localization of decks is a lot easier.

## v. 2.4.0

- Updated enhanced checks to include disfavored rolls
- Attack rolls now allow user to select defense used
- Integrated code from Chain Reaction module so that exploding dice now operate in tandem with TE rules
- Lots of CSS to make journal entries look more Torg-Like
- Integrated "Session Zero" on EN and DE compendiums as a bonus

## v. 2.3.9

- Fixed bug from last two releases that caused problems with updating threat skills

## v. 2.3.8

- Fixed bug from 2.3.7 that caused all threats to have 3 wounds
- Fixed bug from 2.3.7 that caused effects (such as armor) to not be applied
- IMPORTANT: ALL CATEGORIES ON THE NEW CARD SETTINGS SCREEN SHOULD POINT TO A DISTINCT DECK, STACK, OR HAND IN ORDER FOR
  THE CARDS SYSTEM AND COMBAT TRACKER TO WORK CORRECTLY. Most bugs that users experienced in 2.3.7 could be traced back
  to duplicate or broken settings. We will work on creating a smoother, and less problematic integration for these
  settings in upcoming releases.

## v. 2.3.7

- New GM screen interface - be sure to update your Living Land and Core Rulebook modules before using this feature.
- Hotkeys for GM Screen ("G") and player hands ("H")
- Fixed issue where interactions with no adds would not properly generate an interaction attack.
- Threat interface improvements. Expand the threat window to edit the threat's statistics and access its tabs. Collapse
  the threat window to work with a compact stat block.
- Beta Feature - (use with caution!): you can now automaticlaly apply damage to targets. Check the box in the system
  settings menu to enable this feature.
- Thanks to Rwan for the improvements in this update!

## v. 2.3.6

- Fixed issue where player hand cosm button was drawing Destiny cards instead
- Multiple enhancements to drag n drop macros, thanks to Spatula!
- Better default permissions on various discard piles (also thanks to Spatula!)
- You can now select the decks that are used for various game functions, rather than always being forced to use the
  defaults (thanks Rwan!)
- Lots of other changes made to journals, formatting, localization, etc. to make things smoother for multi-language play
  and module releases (Algor has been working tirelessly on all of this, thanks!)

## v. 2.3.5

- Added "life-like" hand option in player hand window (amazing work, Rwan!)
- From Spatula (thanks!): drag-drop skill macros for players
- Intimidation attacks now target Spirit instead of Charisma
- Fixed Active Defense functionality

## v. 2.3.4

- Added support for Monarch cards module (thanks to LordZeel for all his work! It looks amazing)
- Adjusted location of tool tips in sidebar
- Multiple updates to journal styling (thanks Algor!)
- Updates to German basic rules
- Corrected an error relating to the template for the Faith skill
- Known issue: clicking Defenses does not roll active defenses

## v. 2.3.3 - Squashing Bugs

- Fixed issue where item macros could not be created
- Fixed multiple issues involving player combat trackers either generating errors or not updating correctly
- (Confirmed that perk categories should not reset again after this update nor should they reset after future updates)
- Fixed issue where possibilities were not updating when GM uses player bar
- Enhancements and Limitations tabs now available for all perks
- Added German compendiums and ability to hide English/German compendiums (many thanks to Algor for his work to get this
  added!)
- Fixed drag-and-drop attack macros so that they now work properly (thanks for the contribution, Durak!)

## v. 2.3.2 - Pulp Powers Update

- Updated perk types for all official releases to date (thanks @fscx!)
- Updated perk data structure and perk item screen for pulp powers. Now, when you set up a pulp power item, you get two
  more tabs where you can create, select, and edit enhahcements and limitations.
- Fixed a bug where skill test chat buttons didn't work while animated chat was turned off
- Changed base fatigue to 2 (facepalm!)
- Clarified error message displayed in combat tracker when there is no matching hand for a Storm Knight

## v. 2.3.1 - Cards Permissions Patch

- Multiple changes to the way default permissions on cards are handled

## v. 2.3.0 - Character QoL Update

- Added custom skills (create/edit them in Perks tab). Known issue: custom skills cannot be flagged as favored.
- Added AP stat to rollable special abilities
- Added chat notes for output with weapon attacks (keep these brief or you'll clutter your chat log!)
- Added fatigue to character sheet. Fatigue effects can now be added to armor.
- Click on Fatigue label on sheet to automatically increase shock

## v. 2.2.0 - Dramatic Skill Resolution Trackers

- Fixed bug where Blind Fire was not evaluated in attack rolls
- Multiple additional status effects
- Added effects to rollable special abilities (Note: as a general rule, threats should be set up as static entities, so
  use sparingly)
- Updated scene configuration so it is consistent with Version 9
- Fixed bug where secondary cosm was available in dominant zone scenes
- Fixed issue where combat tracker height was not adjusting properly in popouts
- Added DSR counter to combat tracker and to individual combatants
- Updated the Basic Rules based on changes in version 2

## v. 2.1.1

- Fixed tab alignment issue in items
- Removed unofficial card support module dependency
- Updated Welcome message (revised for new version and removed outdated elements from previous versions)
- Updated links dialog
- Update German localization (thanks Algor!)
- Fixed issue where card types were not localizing in configuration windows
- Changed titles of some threat tabs so that tabs format correctly
- Fixed issue where threat equipment lists weren't formatting correctly
- Improved formatting on background tab of Storm Knights

## v. 2.1.0

- Added card support! Too many new features to document here, but you can see a demonstration video here:
  https://www.youtube.com/watch?v=D2VKq_JtJeI&t=227s

## v. 2.0.5

- Update Spanish localization (thanks to ForjaSalve!)

## v. 2.0.4

- Improved detection of defenses that are automatically set for enhanced attacks.
- Corrected issue where concealment modifier is not detected.
- Added filter to attacks section and gears section so that empty categories are not shown.
- Added interaction attacks for Storm Knights.

## v. 2.0.3

- Updated fr.json (thanks VieuxTroll!).
- Attempting Magic/Miracles/Psionics tests unskilled now generates a message indicating that the test cannot be
  completed.
- Fixed an issue where enhanced missile weapon attacks were using Melee Weapons/Unarmed Combat as a defense, rather than
  dodge.
- Added heavy burst to Rapid Fire options in enhanced attack tests

## v. 2.0.1

- Added ability to edit AP on all weapons (previously only heavy weapons had the option for editing AP)

## v. 2.0.0

- Enhanced skill test update! The new system includes multiple enhancements to the skill test system. Shift-click on any
  skill name or attack icon to get a dialog with options for your DN and various modifiers. After rolling, click on the
  "Modifiers" label in chat to update/change DN and modifiers.
- Added target size option to threats (this makes it possible for automation to take target size into account when
  calculating DNs)
- Remomved disabling of possibility button in skill test chat after first check. This enables spending more than one
  possibility on a test, where it is permitted (e.g., Nile Empire).
- Update Storm Knight sheet to make it easier to read
- Update Spanish localization (thanks to lozaljo and ForjaSalve)
- Removed gulpfile and scss dependencies. CSS should now be edited directly.

## v. 1.1.5

- Added custom Torg Eternity dice that are compatible with the Dice So Nice module.
- Added Basic Rules compendium - these are not the official rules, but an informal set of quick start rules that can be
  substituted in their place for those who want to try out the game.

## v. 1.1.4

- Fixed an issue where PC character descriptions weren't displaying properly
- Fixed an issue where heavy weapon descriptions weren't displaying properly
- Added a new generic profile for threats, which should appear in Core Rulebook and other official releases. You can
  also use it (point to systems/torgeternity/images /icons/threat.webp)

## v. 1.1.3

- Fixed an issue where descriptions of enhancements and vehicles weren't displaying properly.
- Fixed an issue where character sheet-based BD rolls weren't triggering animation in the DiceSoNice module.

## v. 1.1.2

- Added button in special abilities window to convert to rollable special ability
- Converted bonus damage rolls to standard Foundry rolls

## v. 1.1.1

- The base attribute for each skill on Storm Knights can now be changed
- Updates Spanish localization (thanks again Forja)
- "Other" Cosm type is now available
- Axioms for Storm Knights can now be edited. However, edits will only allow changes for "other" cosm types. Use effects
  on perks, etc. to change axioms in main cosms.
- Fixed an issue where descriptions of special abilities and rollable special abilities weren't displaying properly

## v. 1.1.0

- Updated functionality for Foundry v. 0.8.x
- Changed character sheet backgrounds to allow for more contrast with text (thanks Forja!)
- Updated Spanish localization (thanks again Forja!)
- Updated player list UI so that GM can take and give possibilities to players
- Re-worked parts of the combat tracker; most of the changes are under the hood
- Fixed a bug where NaN error was displaying when clicking on attributes
- Known Issue: Threats are loading a little more slowly than they should. We are looking into this.

## v. 1.0.0

- Welcome to version 1! Thanks to everyone who has contributed through the testing of our Beta builds!
- We are excited to now be the official Foundry system for Torg Eternity!
- All cards from the core Drama Deck are now available as part of the TE system.
- All 16 original/core archetypes for Torg Eternity are available in a compendium
- Token bars now begin filled/green when you have 0 wounds or shock and deplete as you take more wounds/shock (the
  default was a little counterintuitive so we changed it)
- Updated active defense checks so they work more like skill, weapon, and power checks.
- Fixed an issue where NaN results were displaying when clicking on certain parts of skill line

## v. 0.92.5

- Updated threat sheets so that effects can be managed for threats
- NOTE: Armor effects should be inactive or deleted for threats since their toughness/ armor needs to be entered
  manually on their sheets.
- Updated an issue where some text was appearing as white instead of black.
- Fixed a bug where modifiers weren't displaying correctly in rolls from chat cards
- NEW FEATURE! Each map can now be designated with a cosm and zone type on the map configuration screen. Hover over the
  cosm icon to see the table tent for the current cosm (thanks again Rwan!)
- Dice rolls/roll totals now display as a part of the roll result chat message instead of as a second message.
- Fixed a bug where attribute names weren't appearing on threat rolls.

## v. 0.92.4

- New Feature! Party sheet with summary of each player's stats.
- Fixed an issue where ammo current/max was not displaying properly in item drop-downs
- Updated localization
- Updated vehicle sheet so toughness can accommodate text input
- Updated journal frame to remove overlap between text and frame when sheet is resized
- Added back save button to journal window
- Added AP stat to heavy weapons
- Added setting that allows users to activate/deactivate animations of chat messages

## v. 0.92.3

- Combat tracker update - multiple customizations to combat tracker. You can now sort combatants by heroes/villains.
  Conditions for each combatant now shown. Combatant can be checked off once they have finished their turn.
- New entity called "Custom Attack." You can now specify an attack that rolls any skill and returns either flat damages
  or damages based on any chosen attribute-plus-bonus.
- Changed some fonts in UI; updated UI appearance
- Fixed an issue where some sheets creted under very early versions of the TE system were not correctly displaying
  attributes on SK sheets.
- Fixed an issue where spells were not rollable.
- Updated appearance of threat sheets.
- Draggable macros! Players can drag any perk, gear, weapon, power, etc. onto the macro hotbar for easier access during
  play. (Thanks again, @rwan for this and the combat tracker update!)

## v. 0.92.1

Various bug fixes and some additional UI enhancements. Added data structure to some items and reorganized some of the
item windows to accommodate additional data structure. Added ability to track ammo by treating ammo as a resource
(current/max). NOTE: sorry, everyone, but you are going to lose the data in your ammo field in existing weapons sheets.
You'll need to re-input the max ammo for any existing items. We will try to avoid doing this much, if any, in the
future.

Updated appearance of journal entry windows.

Known issue: some sheets that were created with a VERY early version of the system may display the attributes window
improperly on the Storm Knight sheet. We haven't tried to fix this because we assume there aren't many sheets like that
floating around out there. But if it is an issue for you, let us know. We can fix it.

## v. 0.92.0

Major user interface update! We have completely revamped all of the sheets (thanks much to @rwanoux for all his hard
work to get this done!).

NOTES FOR v. 0.91.0 We have added support for active effects! These effects are available for each Storm Knight and for
any items attached to Storm Knights. Active effects allow you to modify the base statistics for Storm Knights. They are
most useful for adding armor and defenses, but can also be used to modify skill values, attributes, and other related
statistics. To apply an active effect from an item (such as a piece of armor), create or edit the armor from the items
tab and add a passive effect that mirrors the abilities of the item. Then, drag and drop it onto the chracter sheet
(note that Foundry does not currently support editing active effects within items once they are attached to a character,
but you can still edit the effect on the character's "Effects" tab). For a list of Storm Knight statistics that can be
modified, see https://github.com/gmmatt/torgeternity/wiki/Storm-Knight-Data-Elements.
