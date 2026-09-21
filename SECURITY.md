# Security

RaveLite has no server, no account and no analytics. Everything it
records lives on the phone in app-private storage. The only network
requests it makes are to Open-Meteo, for the forecast and for looking up
a town by name, carrying a location rounded to about 10 km.

The export in Settings → Your data writes that same storage, verbatim,
to a file you pick — it is a plain JSON copy of everything the app knows
about you, so treat it the way you would treat a diary.

That means most classic vulnerabilities do not apply. What is worth
reporting:

- A way for another app on the device to read or alter RaveLite's data.
- Anything that sends more than the rounded location off the device.
- A crash or hang that can be triggered by data the app receives.
- Anything about the notification or alarm handling that could be abused.

Report it by opening an issue. If you would rather not do that publicly,
say so in an issue with no detail and a maintainer will find a way to
talk privately.

There is no bounty, and no promise of a timeline. This is a personal
project shared in the open.
