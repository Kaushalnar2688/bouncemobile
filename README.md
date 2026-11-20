
# ONE MORE BOUNCE — Mobile Edition

A separate portrait-first mobile horror prototype made with Three.js.

It does not modify or depend on the desktop edition.

## Run locally

Because this uses JavaScript modules, run it through a local web server.

Do not double-click the HTML file.

```bash
python -m http.server 8000
```

Then open:

http://localhost:8000

## Deploy to Vercel

1. Upload this folder to a new GitHub repository.
2. In Vercel, import that repository.
3. Set Framework Preset to Other.
4. Leave Build Command blank.
5. Set Output Directory to .
6. Deploy.

Vercel provides HTTPS, which is required for phone motion sensors.

## Mobile controls

- Motion mode: approve motion/orientation access.
- Hold the phone upright and turn to aim.
- Walk in place to move.
- Touch mode: use the virtual joystick to move.
- Drag the game view to look around.
- Light: toggle flashlight.
- Use: collect fuses and restore power.
- Hide: tap near either party table.
- Pause: pause or restart.

## Objective

Find all three backup fuses.

Restore power at the exit panel.

Reach the exit.

The Bouncer roams the park and is drawn toward noise.

Trampolines create extra noise and can briefly bounce the player.

## Test mode

Enable TEST MODE on the main menu to disable the Bouncer.

You can explore the environment, test the flashlight, and collect fuses safely.

## Notes

Device orientation and motion APIs vary across phones and browsers.

iOS asks for permission from a button press.

Android usually prompts less explicitly.

Sensor-based walking is an accelerometer step estimate, not GPS tracking.

Touch controls are always available as a fallback.

Three.js is loaded from jsDelivr, so the device needs an internet connection.
