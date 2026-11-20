# ONE MORE BOUNCE — Mobile Edition

A separate portrait-first mobile horror prototype made with Three.js. It does not modify or depend on the desktop edition.

## Run locally

Because this uses JavaScript modules, run it through a local web server (not by double-clicking the HTML file).

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` from the project folder.

## Deploy to Vercel

1. Upload this folder to a new GitHub repository, or copy its contents into a new repository.
2. In Vercel, import that repository.
3. Set **Framework Preset** to `Other`.
4. Leave **Build Command** blank.
5. Set **Output Directory** to `.` (the repository root).
6. Deploy. Vercel provides HTTPS, which is required for phone motion sensors.

## Mobile controls

- **Motion mode:** tap Enter JumpZone and approve motion/orientation access. Hold the phone upright. Turn your body/phone to aim. Walk in place to move. Tap Recalibrate if the direction drifts.
- **Touch mode:** use the virtual joystick to move and drag the game view to look around.
- **Light:** toggle the flashlight.
- **Use:** collect fuses, restore power, and leave through the exit.
- **Hide:** tap near either party table to hide. Tap again to leave.
- **Pause:** pause/restart from the top-right button.

## Objective

Find all three backup fuses, restore power at the exit panel, then reach the exit. The Bouncer roams the park and is drawn toward noise. Trampolines create extra noise and can briefly bounce the player.

## Notes

- Device orientation and motion APIs vary across phones and browsers. iOS asks for permission from a button press; Android usually prompts less explicitly.
- Sensor-based walking is an accelerometer step estimate, not GPS tracking. The touch controls are always available as a fallback.
- Three.js is loaded from jsDelivr, so the device needs an internet connection to load the game.
