# Agreed game rules

## Accounts

- Username and password only.
- Usernames are 3–20 characters, case-insensitive, and may contain letters, numbers, and underscores.
- Passwords are at least 8 characters.
- Password recovery is performed manually by the project owner.

## Currencies

- `chips` are used for blackjack wagers.
- `dunkaroos` are used for cosmetic purchases.
- New accounts begin with 100 chips and 0 dunkaroos.
- The first authenticated visit on each Eastern calendar day adds 100 chips.
- Missed days do not accumulate.
- The daily login grant is additive, regardless of the existing balance.
- A successful daily dealer passcode adds another 100 chips.

## Blackjack

- A fresh randomized 52-card deck is created for each hand.
- Minimum bet: 10 chips.
- Maximum bet: 100 chips.
- Bet increment: 10 chips.
- The wager is selected before cards are dealt and cannot change during the hand.
- Dealer stands on every 17, including soft 17.
- Player actions: hit and stand only.
- No double down, splitting, insurance, or surrender.
- Normal win profit: 1:1.
- Natural blackjack profit: 3:2, rounded up to the nearest whole chip.
- A push returns the original wager and earns no dunkaroos.
- A loss forfeits the wager and earns no dunkaroos.
- Positive chip profit awards an equal number of dunkaroos.
- A player with fewer than 10 chips cannot begin a hand.

## Shop and inventory

Categories:

- `card_back`
- `table`
- `music`
- `win_sound`
- `bust_sound`
- `decoration`

Rules:

- Each item belongs to exactly one category.
- Shop content and prices are fixed in server TypeScript.
- Purchased items are permanent.
- No refunds, duplicate purchases, or price changes.
- Purchasing adds the item to inventory but does not equip it.
- Equipment may be changed from the menu while no hand is active.
- Only one item may be equipped per category.
- Card back, table, music, win sound, and bust sound use built-in defaults when no purchased item is equipped.
- Decoration defaults to nothing and appears in the background-right slot.
- All non-default shop items are available whenever the shop is accessible.

## Dealer passcode

- The relevant day is calculated in `America/New_York`.
- A user gets one attempt per Eastern calendar day.
- Correct, incorrect, blank, and alternate-dialogue submissions all consume the attempt.
- Correct answers add 100 chips.
- Saturday's alternate answer produces alternate dialogue but no reward.
- Hints and dialogue are fixed server content.
