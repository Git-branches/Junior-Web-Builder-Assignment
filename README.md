# Marci Metzger · The Ridge Realty Group — Homepage Redesign

A single-page redesign of the homepage at <https://marcimetzger.com/>, built as a
hiring-assignment submission. Static HTML/CSS/JS — no build step, no framework,
no dependencies. Open `index.html` in any browser.

```
index.html
assets/
  css/styles.css      one stylesheet, sectioned to match the page order
  js/main.js          header state, mobile menu, scroll reveal, lightbox, forms
  img/                21 images, all taken from the original site
```

---

## Where the content came from

Every fact on this page is from the client's existing site (homepage + About
page). Nothing was invented — no testimonials, awards, credentials, properties
or statistics that the source doesn't state.

| Section | Source |
|---|---|
| Hero copy | "REALTOR for Nearly Three Decades"; "helping buyers and sellers in many markets since 1995"; "Nobody knows the market like we do" |
| Stats | "since 1995"; "closed 28.5 million in sales"; "helped nearly 90 clients in 2021"; "Top Residential Sales Last 5 Years" |
| Sellers | "Don't Just List it… Get it SOLD!" block |
| Buyers | "Guide to Buyers" block |
| Search fields | The original's seven filters, with their real option lists — all 42 locations, and Residential / Residential Lease / High Rise / Land |
| Photo gallery | All 7 photos from the original's Photo Gallery carousel |
| Life in Pahrump | Marci's own words from the About page, quoted and attributed |
| Services | The three "Our Services" blocks, split so each says something different |
| About | The About-page biography, condensed |
| Contact / footer | Phone, office address, hours, map, socials, copyright line |

**Two honest notes about the numbers.** "Nearly 90 clients" is shown as `~90`
rather than `90`, because rounding up would overstate it. And the experience
figure is shown as `1995` rather than "30+ years" — the site's own "nearly three
decades" wording predates the current year, and a start date can't go stale.

## What I deliberately changed

The brief was to improve the brand, not replace it. The original's content is
good; its hierarchy is what buries it.

- **Hierarchy.** The original opens with a slideshow and a phone number. This
  opens with one claim, one photograph and two clear choices, then answers
  *why trust her* immediately after in a dark stats band.
- **A real decision point.** Buyer and seller content was scattered; it's now a
  single two-path section right after the credibility band.
- **The gallery became a story.** The original's carousel hides seven photos
  behind arrow clicks, unlabelled. They are all aerial and interior shots of the
  Mountain Falls community — the golf course, clubhouse, resort pool and
  pickleball courts, with the Spring Mountains behind. They now sit in one
  mosaic, captioned, under Marci's own quote about why she lives there, with a
  keyboard-accessible lightbox for a closer look.
- **Differentiated services.** The original repeats "Commercial & Residential"
  three times over three different descriptions. Each service now has a distinct
  job: Buy, Sell, Expertise.
- **Type and colour.** Cormorant Garamond for editorial display, Inter for
  everything functional. Warm ivory, deep charcoal, taupe and a deep olive
  accent — five colours, no gradients, no rounded-card grid.
- **Composition over components.** Full-bleed bands, an overlapping hero card,
  an offset buyer panel, a floating search panel, hairline rules instead of
  boxes. Only the contact form is framed, and only to balance its column.

**One gotcha worth recording.** The site writes its address as "3190 HW-160".
Google does not geocode that token — it silently lands on Desert View Hospital,
a different part of Pahrump. The map and the directions link therefore spell out
`3190 S Highway 160` and pin explicit coordinates, while the address stays
written as the client writes it. Worth checking any embedded map against the
original rather than assuming the address string resolves.

## Things that are presentational, and say so

There is no MLS back end and no mail service behind a static page, so nothing
pretends otherwise:

- **Property search** — the filters are real, accessible controls carrying the
  original's own option lists, read out of the live MLS widget rather than
  guessed. Submitting opens Marci's live listings page, and a visible note under
  the form says exactly that. The service-area list is worth keeping intact: it
  shows she covers far more than Pahrump.
- **Contact form** — validates that name and email are present, then tells the
  visitor plainly that the form isn't wired up yet and gives them the phone
  number. The phone number is a working `tel:` link throughout, and the address
  links to Google Maps.

## Motion

One system, driven by six tokens at the top of `styles.css` — `--ease`,
`--reveal-dist`, `--reveal-dur`, `--stagger`, `--hover-dur`, `--zoom`. Change
the feel of the whole page there rather than section by section.

- **Hero** animates on load, not on scroll: eyebrow → headline → copy → buttons
  → photograph, 90ms apart. The photograph settles out of a 1.03 scale instead
  of sliding, so it reads as a photograph rather than a card. Nothing blocks
  interaction — the page is usable from the first frame.
- **Everything else** reveals on scroll through one `IntersectionObserver`:
  30px up, 620ms, once each, unobserved as soon as it fires. Section headings
  reveal progressively (eyebrow, then heading, then description) so the eye is
  led in reading order rather than hit with the whole block.
- **Stagger** is opt-in per group via a `.stagger` class; only stats, the two
  pathways, services and the gallery use it.
- **Statistics** count up on entry, but only where counting means something.
  1995 is a year, not a quantity, so it reveals instead. The authored string is
  restored verbatim at the end of every count, so the number on screen is always
  exactly the number in the markup — the animation can never round it.
- **Only `opacity` and `transform`** are animated, never width, height or
  offsets, so nothing reflows mid-animation. Stat figures use `tabular-nums` so
  a counting number cannot shift its own layout.
- **Entrance scale is kept off any image that also zooms on hover**, so the two
  never fight over `transform`.

Under `prefers-reduced-motion: reduce` the reveals resolve to their final state,
transitions and delays collapse, smooth scrolling reverts to instant, and the
count-up is skipped entirely. Verified by emulating the preference: nothing is
left hidden and the figures still read 1995 / $28.5M / 90.

## Accessibility & performance

- Semantic landmarks, one `h1`, ordered headings, skip link, visible focus rings
  on every interactive element, labels on all six search fields and all three
  contact fields.
- Text colours were contrast-checked against their actual backgrounds; the warm
  accent has two tokens (`--taupe`, `--taupe-ink`) so small labels stay at 4.5:1
  on ivory as well as on charcoal.
- Animation is a single fade-and-rise via `IntersectionObserver`. It is disabled
  under `prefers-reduced-motion`, and the reveal styles only apply once JS has
  confirmed it can undo them — with scripting off, nothing is hidden.
- The back-to-top button appears only once you are a full screen down, and
  returns focus to the top of the page rather than leaving keyboard users
  stranded at the bottom. It honours `prefers-reduced-motion` by jumping instead
  of gliding, and stays hidden if the script never runs.
- The gallery lightbox is driven by real `<button>` elements, so it opens from
  the keyboard. Arrow keys move between photos, Escape closes, Tab stays inside
  the dialog, and closing returns focus to the photo you were viewing rather
  than to the top of the page.
- Images carry `width`/`height` (no layout shift), are `lazy` below the fold,
  and the hero is preloaded. All were re-encoded and capped at roughly 2× their
  largest rendered size, which is what keeps 21 photographs to **2.4 MB** total.
  Only the hero loads up front.

Verified at 320 / 375 / 768 / 1024 / 1440 px: no horizontal overflow, no console
errors, mobile menu opens, closes on selection and on Escape.

**Known next step:** WebP/AVIF with `<picture>` fallbacks would cut image weight
roughly in half again. It was left out on purpose — it needs a build step, and
the brief asked for code a junior developer can read end to end.

## Image credit

All photography and logos are downloaded from the original marcimetzger.com.

The seven gallery photographs are real listing photos of Pahrump properties
(Mountain Falls). The hero, the two buyer/seller panels, the search backdrop and
the three service tiles come from the site builder's stock library — that is what
the original uses in those slots. They are reproduced here only to keep the
redesign faithful to the brief; a production deploy should confirm the licence
for each.

**A note on how these were found.** The Photo Gallery is rendered by JavaScript,
so it does not exist in the page's served HTML — the markup ships ten empty
`<img>` placeholders. Reading the static source alone misses all seven photos and
mistakes the three Services tiles for gallery images. They were recovered by
loading the live page in a headless browser, scrolling it to force every lazy
image to commit to a real `src`, and reading the resulting DOM.
