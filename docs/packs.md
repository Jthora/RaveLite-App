# Writing a pack

A pack is a curriculum: a set of drills, grouped the way they are worth
learning, plus any Daily Sets tracks they turn on. Packs are pure data,
so adding one takes no app code — which is the point, and also the
constraint everything below exists to protect.

If you can write JSON and you know your subject, you can add it.

## What a pack is not

A pack is **not** the program. The base program — push, pull, squat,
hinge, breath, posture, stillness, mobility — belongs to everyone and
lives outside packs entirely. Turning every pack off still leaves a
complete, balanced program, and there is a test that says so.

So a pack is a specialism on top: the dancing, the fighting, the staff,
the tests. If what you are adding is something *everybody* should do, it
is probably a change to the base library instead, and worth opening an
issue about first.

## The shape

```jsonc
{
  "id": "capoeira",                       // lower-case, hyphenated, unique
  "name": "Capoeira basics",
  "detail": "Ginga, esquiva and the low game. Needs room to move.",

  "drills": [ /* see below */ ],

  "groups": [                             // the curriculum, in teaching order
    {"title": "Capoeira", "ids": ["fire.ginga", "fire.esquiva"]}
  ],

  "extras": [],                           // drills the pack owns but does not teach
  "tracks": []                            // Daily Sets tracks it turns on
}
```

`groups` is what appears in Practice, section by section, in the order
you list. `extras` is for drills the plan schedules rather than you
practising — a graded run, a test event. A drill may belong to more than
one pack; it exists if **any** of its packs is on.

## A drill

```jsonc
{
  "id": "fire.ginga",                     // "element.some-name", globally unique
  "element": "fire",                      // fire · air · earth · water · heart
  "name": "Ginga",
  "purpose": "The step everything else in capoeira comes out of.",
  "dose": "3 × 60 sec",
  "cues": ["Stay low", "Cross the arm that matches the back foot"],
  "targets": ["Coordination", "Agility"],
  "venues": ["standing", "yard"],
  "approxSeconds": 60,
  "move": "kick"                          // which pictogram to draw
}
```

| Field | Rule |
|---|---|
| `id` | `element.lower-hyphenated`, unique across every pack and the library |
| `element` | one of the five; the id must start with it |
| `purpose` | one sentence answering *why am I doing this* |
| `dose` | what one go is: `3 × 10`, `60 sec` |
| `cues` | optional, but this is where the drill is actually taught |
| `targets` | at least one, from the list the app knows |
| `venues` | at least one — where it can honestly be done |
| `approxSeconds` | 5–3600, how long one go takes |
| `move` | the pictogram, from the list the app draws |

Run the validator (below) and it will name every list in full.

## The rules that get packs rejected

**No equipment this app does not assume.** RaveLite promises a body, a
floor and whatever happens to be in the room. No gym, no weights, no
machines, no pool. A drill that needs them is not a RaveLite drill, however
good it is. If it needs something portable — a staff, a ball, bricks —
say so through `venues` and the kit system, and open an issue if the kit
list is missing what you need.

**Be honest about `venues`.** This is the promise the whole program rests
on: someone in a quiet flat with no floor space is only ever offered
drills that say they work there. A drill marked `standing` that really
needs three metres of room breaks that promise for the person least able
to work around it.

**Teach, don't just list.** A drill with no cues is a name. The app shows
cues while the chime is up, and that is often the only coaching anybody
gets.

**Ids are global and permanent.** They end up in people's training logs.
Renaming one orphans their history, so pick carefully the first time.

## Checking it

```ts
import {validatePack, explainProblems} from './src/domain/packs/validate';

explainProblems(validatePack(myPack)).forEach(line => console.log(line));
```

An empty list means it can be merged. Otherwise you get one line per
problem, each naming where it is and what to do:

```
pack "capoeira" drill 1 (fire.ginga): has no purpose. One sentence answering "why am I doing this".
pack "capoeira" group 1: names "fire.au", which does not exist. Add it to this pack's drills, or use an id from the library.
```

Every pack this app ships is held to exactly these rules by the same
function, so there is no second standard for built-in content.

[`docs/example-pack.json`](example-pack.json) is a complete, working pack
— copy it and start editing. It is validated by the test suite, so if it
ever stops being correct, the build says so rather than you finding out.

## Submitting one

Packs ship as source, reviewed like any other change — there is no
sideloading in the beta, and no way to install a pack from a file. Open a
pull request adding your pack, with the validator passing.

What review looks for beyond the validator:

- **Is the content right?** Cues that teach a movement badly are worse
  than no pack. Expect to be asked where a progression comes from.
- **Is it safe for a stranger?** Assume somebody deconditioned tries the
  first thing on the list, alone, with no supervision.
- **Does it earn its place?** A pack of four drills that overlap the base
  program is a settings row that does nothing.

Content is licensed with the app (Apache-2.0). Only submit work you have
the right to give away — not text or progressions copied out of a book, a
course or another app.
