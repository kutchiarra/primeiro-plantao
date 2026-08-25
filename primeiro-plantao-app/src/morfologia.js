// Morfologia PQRST em fração do intervalo RR.
// Mora fora do componente porque duas telas desenham o mesmo coração: a fita
// que corre ao vivo e o impresso de 12 derivações.
//
// supra = elevação do segmento ST em mV. É o supradesnivelamento do caso —
// zero num traçado normal, positivo na parede que infartou e negativo nas
// derivações recíprocas.
export function amplitude(f, supra) {
  if (f < 0.08) return 0;
  if (f < 0.18) return 0.14 * Math.sin(((f - 0.08) / 0.1) * Math.PI);   // onda P
  if (f < 0.225) return 0;                                              // PR
  if (f < 0.245) return -0.09 * ((f - 0.225) / 0.02);                   // Q
  if (f < 0.265) return -0.09 + 1.35 * ((f - 0.245) / 0.02);            // R
  if (f < 0.295) return 1.26 - 1.55 * ((f - 0.265) / 0.03);             // S
  if (f < 0.34) return -0.29 + (0.29 + supra) * ((f - 0.295) / 0.045);  // volta ao ST
  if (f < 0.44) return supra;                                           // segmento ST
  if (f < 0.66) return supra + 0.34 * Math.sin(((f - 0.44) / 0.22) * Math.PI); // T apiculada
  return 0;
}
