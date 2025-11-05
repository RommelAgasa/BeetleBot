export const helpItems = [
  {
    id: "steering",
    title: "Steering Wheel",
    purpose: "Controls the direction of the Beetlebot.",
    functions: [
      "Tilt left → Turn left",
      "Tilt right → Turn right"
    ],
    icon: "steering"
  },
  {
    id: "brake",
    title: "Brake Pedal",
    purpose: "Stops the motors immediately.",
    functions: [
      "Tap or hold to send a Stop / Brake command."
    ],
    icon: "brake"
  },
  {
    id: "gear",
    title: "Gear Lever",
    purpose: "Sets the driving mode or speed.",
    functions: [
      "Reverse → Move backward",
      "Gear 1 → Slow/normal speed",
      "Gear 2 → Fast speed (higher PWM)"
    ],
    icon: "gear"
  },
  {
    id: "accelerator",
    title: "Accelerator Pedal",
    purpose: "Controls forward throttle.",
    functions: [
      "Light press / drag → slow speed",
      "Full press → max speed"
    ],
    icon: "accelerator"
  },
  {
    id: "horn",
    title: "Horn Button",
    purpose: "Toggle horn (open/close or on/off)",
    functions: [
      "When tapped, triggers buzzer or servo horn movement"
    ],
    icon: "horn"
  }
];