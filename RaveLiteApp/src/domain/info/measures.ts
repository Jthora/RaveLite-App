/**
 * How to measure a thing so today's number can be compared with last
 * month's — and what each fitness-test event actually asks of you.
 *
 * The rule behind every line: one protocol, written down, repeated. A max
 * that was measured differently isn't a max, it's a story.
 */

/** Train-log kinds: what the number means and how to take it. */
export const MEASURES: Record<string, string> = {
  'builtin.run-3mi':
    'Three miles on the same route, running the whole way. The Marine PFT distance.',
  'builtin.run-2mi':
    'Two miles on the same route, hard but even. The Air Force and Space Force distance.',
  'builtin.run-1.5mi':
    'A mile and a half, run at a pace you can only just hold.',
  'builtin.run-custom':
    'Any run: enter the distance and the time. It still counts toward the 2- and 3-mile estimates, scaled to the pace.',
  'builtin.pushups-amrap':
    'One unbroken set to failure: chest to a fist off the floor, elbows back, body in a line. Stop when form goes, not when it burns.',
  'builtin.pushups-2min':
    'As many as you can in two minutes. Resting in the up position is allowed; a knee down ends it.',
  'builtin.pushups-1min':
    'As many as you can in one minute, same rules as the two-minute set.',
  'builtin.situps-2min':
    'Two minutes. Knees bent, feet held or hooked, shoulder blades to the floor and elbows past the knees.',
  'builtin.situps-1min':
    'One minute of sit-ups, same rules as the two-minute set.',
  'builtin.pullups-amrap':
    'Dead hang to chin over the bar, no kipping, arms straight at the bottom of every rep.',
  'builtin.burpees-2min':
    'Two minutes: chest to floor, then a jump with hands overhead.',
  'builtin.cft-mtc':
    '880 yards as fast as you can — the Marine combat fitness test opener. About half a mile.',
  'builtin.cft-acl':
    'Two minutes of lifting a 30 lb load from shoulder height to overhead. Bricks in a pack stand in for the ammo can.',
  'builtin.cft-manuf':
    'The maneuver-under-fire course, timed: sprints, a crawl, a carry, a drag.',
  'builtin.breath-hold':
    'After a normal breath in, hold until the first strong urge to breathe. Sitting, never in water, never pushed to dizziness.',
  'builtin.exhale-hold':
    'Breathe all the way out, then hold. Measures calm under CO₂ more than lung size.',
  'builtin.box-breath-2min':
    'Two minutes of four-count breathing: in, hold, out, hold.',
  'builtin.skipping-2min':
    'Two minutes of rope skips, counting jumps. Misses stop the count for as long as it takes to start again.',
  'builtin.crunches-2min':
    'Two minutes of crunches, shoulder blades off the floor each rep.',
  'builtin.leg-hipup':
    'Legs to vertical, then hips off the floor. Count clean reps.',
  'builtin.side-ups-amrap':
    'Side-ups on the weaker side only — the number that matters, and the one that lags.',
  'builtin.squats-amrap':
    'One set to failure: hip crease below the knee, heels down, chest up.',
  'builtin.plank':
    'Forearm plank held to the second the hips drop. Straight line from ear to ankle.',
  'builtin.side-plank':
    'Side plank on the weaker side, hips stacked and lifted.',
  'builtin.deadhang':
    'Dead hang from your hang point, shoulders active, until the grip goes.',
  'builtin.wall-sit':
    'Back flat to the wall, thighs parallel to the floor, until the legs give.',
  'builtin.farmer-carry':
    'Bricks in each hand, walked as far as the grip lasts.',
  'builtin.weighted-carry-time': 'Bricks carried for time instead of distance.',
  'builtin.balance-hold':
    'One leg, eyes closed, hands off anything. Time stops at the first hop or touch. Take the weaker leg.',
  'builtin.still-sit':
    'Sitting without moving: no shifting, no scratching. Time stops at the first fidget, not the first thought.',
  'builtin.flow-no-drop': 'Staff flow from the first spin to the first drop.',
  'builtin.flow-hold':
    'A long fascia hold, timed — how long the position can be kept soft.',
  'builtin.deep-squat-hold':
    'Bottom of a squat, heels down, spine long, held until the heels lift or the back rounds.',
  'builtin.shoulder-cars':
    'Slow controlled shoulder circles through the biggest pain-free range.',
  'builtin.hip-cars':
    'Slow controlled hip circles, standing tall, no leaning to cheat range.',
  'builtin.staff-session':
    'Staff or combat-dance flow, timed from first spin to last.',
  'builtin.bike-ride': 'Time in the saddle, however hard you rode.',
  'builtin.ruck':
    'Walking with bricks in a pack. Load and ground both count; the time is the record.',
  'builtin.walk-session':
    'An easy walk — recovery, not training. Still movement.',
  'builtin.yoga-video': 'A yoga session played on another screen, timed.',
  'builtin.tai-chi-video': 'A tai chi session played on another screen, timed.',
  'builtin.quiet-cardio-video':
    'Low-noise cardio from a video — the kind that keeps the floor quiet.',
  'builtin.waist':
    'Around the navel, tape snug but not biting, at the end of a normal breath out. Same time of day each month.',
};

/** Fitness-test events: what the test asks, in a line. */
export const EVENT_WHAT: Record<string, string> = {
  'pushups-1min':
    'One minute of push-ups — the Air Force and Space Force strength event.',
  'pushups-2min':
    'Two minutes of push-ups. The Marine option worth at most 70 of 100 points.',
  pullups:
    'Dead-hang pull-ups, no kipping. The Marine event that can score a full 100.',
  plank: 'A forearm plank held for time — the core event on all three tests.',
  'situps-1min':
    'One minute of sit-ups, the Air Force and Space Force core option.',
  'run-2mi':
    'A two-mile run for time, the Air Force and Space Force cardio event.',
  'run-3mi': 'A three-mile run for time, the Marine PFT cardio event.',
  'cft-mtc':
    'Movement to contact: 880 yards flat out, the combat fitness test opener.',
  'cft-acl': 'Ammo-can lifts: two minutes overhead with a 30 lb load.',
  'cft-manuf':
    'Maneuver under fire: a timed course of sprints, crawls, a carry and a drag.',
  'waist-height':
    'Waist measurement divided by height. Under half your height is the mark the Air Force scores full points for.',
  'breath-hold': 'How long a calm breath hold lasts, sitting.',
  'exhale-hold': 'How long a hold lasts with the lungs empty — calm under CO₂.',
  'rope-skips': 'Rope skips in two minutes, counting jumps.',
  'still-sit': 'Sitting still without moving, timed.',
  'sets-done':
    'The share of the day sets you actually answered, across the week.',
  squats: 'One set of squats to failure, below parallel.',
  'wall-sit': 'A wall sit held to the second the legs give.',
  'dead-hang': 'A dead hang from your hang point until the grip goes.',
  'side-plank': 'A side plank on the weaker side, held for time.',
  balance: 'Single-leg balance with the eyes closed, on the weaker leg.',
  'deep-squat-hold': 'The bottom of a squat, held with the heels down.',
  'staff-flow': 'Staff flow from the first spin to the first drop.',
};
