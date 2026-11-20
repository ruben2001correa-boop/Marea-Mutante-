import { useEffect, useRef, useState } from 'react';

export interface GamepadSnapshot {
  connected: boolean;
  name: string;
  moveX: number;
  moveY: number;
  aimX: number;
  aimY: number;
  aimActive: boolean;
  attackHeld: boolean;
  dashPressed: boolean;
  interactPressed: boolean;
  helmPressed: boolean;
  nextSlotPressed: boolean;
  prevSlotPressed: boolean;
  pausePressed: boolean;
  drawerPressed: boolean;
}

const DEADZONE = 0.18;

function applyDeadzone(v: number): number {
  if (Math.abs(v) < DEADZONE) return 0;
  const sign = v > 0 ? 1 : -1;
  return (sign * (Math.abs(v) - DEADZONE)) / (1 - DEADZONE);
}

/**
 * Polls standard Bluetooth / USB console controllers (Xbox, PlayStation, Switch, Generic)
 * via HTML5 Gamepad API inside requestAnimationFrame without re-rendering React 60fps.
 */
export function useGamepad() {
  const [connectedInfo, setConnectedInfo] = useState<{ connected: boolean; name: string }>({
    connected: false,
    name: '',
  });
  const prevButtonsRef = useRef<Record<number, boolean>>({});

  useEffect(() => {
    const syncConnected = () => {
      const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
      const active = Array.from(pads || []).find((p): p is Gamepad => Boolean(p && p.connected));
      setConnectedInfo((prev) => {
        const nextConnected = Boolean(active);
        const nextName = active ? active.id.split('(')[0].trim().slice(0, 28) || 'Mando Bluetooth' : '';
        if (prev.connected === nextConnected && prev.name === nextName) return prev;
        return { connected: nextConnected, name: nextName };
      });
    };

    window.addEventListener('gamepadconnected', syncConnected);
    window.addEventListener('gamepaddisconnected', syncConnected);
    const id = window.setInterval(syncConnected, 2500);
    syncConnected();

    return () => {
      window.removeEventListener('gamepadconnected', syncConnected);
      window.removeEventListener('gamepaddisconnected', syncConnected);
      window.clearInterval(id);
    };
  }, []);

  const pollSnapshot = (): GamepadSnapshot => {
    const empty: GamepadSnapshot = {
      connected: false,
      name: '',
      moveX: 0,
      moveY: 0,
      aimX: 0,
      aimY: 0,
      aimActive: false,
      attackHeld: false,
      dashPressed: false,
      interactPressed: false,
      helmPressed: false,
      nextSlotPressed: false,
      prevSlotPressed: false,
      pausePressed: false,
      drawerPressed: false,
    };

    if (typeof navigator === 'undefined' || !navigator.getGamepads) return empty;
    const pads = navigator.getGamepads();
    const gp = Array.from(pads || []).find((p): p is Gamepad => Boolean(p && p.connected));
    if (!gp) {
      prevButtonsRef.current = {};
      return empty;
    }

    const ax0 = applyDeadzone(gp.axes[0] ?? 0);
    const ax1 = applyDeadzone(gp.axes[1] ?? 0);
    const ax2 = applyDeadzone(gp.axes[2] ?? 0);
    const ax3 = applyDeadzone(gp.axes[3] ?? 0);

    // D-Pad fallback on buttons 12-15
    const dpadUp = Boolean(gp.buttons[12]?.pressed);
    const dpadDown = Boolean(gp.buttons[13]?.pressed);
    const dpadLeft = Boolean(gp.buttons[14]?.pressed);
    const dpadRight = Boolean(gp.buttons[15]?.pressed);

    const moveX = ax0 !== 0 ? ax0 : (dpadRight ? 1 : 0) - (dpadLeft ? 1 : 0);
    const moveY = ax1 !== 0 ? ax1 : (dpadDown ? 1 : 0) - (dpadUp ? 1 : 0);
    const aimActive = Math.hypot(ax2, ax3) > 0.2;

    const prev = prevButtonsRef.current;
    const isPressed = (idx: number) => Boolean(gp.buttons[idx]?.pressed);
    const justPressed = (idx: number) => isPressed(idx) && !prev[idx];

    // Standard Gamepad Mapping:
    // 0: A / Cross (Attack or Interact), 1: B / Circle (Dash), 2: X / Square (Helm), 3: Y / Triangle (Interact)
    // 4: LB, 5: RB, 6: LT, 7: RT (Attack), 8: Select/Back (Drawer), 9: Start (Pause/Underworld Menu)
    const attackHeld = isPressed(0) || isPressed(7) || (gp.buttons[7]?.value ?? 0) > 0.35;
    const dashPressed = justPressed(1) || justPressed(6);
    const helmPressed = justPressed(2);
    const interactPressed = justPressed(3);
    const prevSlotPressed = justPressed(4);
    const nextSlotPressed = justPressed(5);
    const drawerPressed = justPressed(8);
    const pausePressed = justPressed(9);

    const nextPrev: Record<number, boolean> = {};
    for (let i = 0; i < gp.buttons.length; i++) {
      nextPrev[i] = Boolean(gp.buttons[i]?.pressed);
    }
    prevButtonsRef.current = nextPrev;

    return {
      connected: true,
      name: gp.id.split('(')[0].trim().slice(0, 28) || 'Mando Bluetooth',
      moveX,
      moveY,
      aimX: ax2,
      aimY: ax3,
      aimActive,
      attackHeld,
      dashPressed,
      interactPressed,
      helmPressed,
      nextSlotPressed,
      prevSlotPressed,
      pausePressed,
      drawerPressed,
    };
  };

  return {
    connected: connectedInfo.connected,
    controllerName: connectedInfo.name,
    pollSnapshot,
  };
}
