// Utility to generate 15-minute time slots between opening and closing times
export function generateTimeSlots(opening: string, closing: string): string[] {
  // opening/closing: '09:00' or '09:00:00' format
  const pad = (n: number) => n.toString().padStart(2, '0');
  const [openH, openM] = opening.split(':').map(Number);
  const [closeH, closeM] = closing.split(':').map(Number);
  const slots: string[] = [];
  let h = openH, m = openM;
  while (h < closeH || (h === closeH && m < closeM)) {
    slots.push(`${pad(h)}:${pad(m)}`);
    m += 15;
    if (m >= 60) { h += 1; m = 0; }
  }
  return slots;
}
