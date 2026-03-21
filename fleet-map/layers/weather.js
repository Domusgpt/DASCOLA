// ─────────────────────────────────────────────────────────
//  DASCOLA — Weather Overlay Layer
//  Renders NOAA weather data as icons on the map
// ─────────────────────────────────────────────────────────

/**
 * Draw weather overlay
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasManager} cm
 * @param {Array} weatherData — array of station data from NOAAClient
 * @param {Array} warnings — active marine warnings
 * @param {AssetRenderer} renderer
 * @param {object} config
 * @param {number} t — animation time
 */
export function drawWeather(ctx, cm, weatherData, warnings, renderer, config, t) {
  if (!weatherData || !weatherData.length) return;

  const { w, h } = cm;

  ctx.clearRect(0, 0, w, h);

  // Draw weather stations
  for (const station of weatherData) {
    const pos = cm.proj(station.lat, station.lon);
    if (pos.x < -50 || pos.x > w + 50 || pos.y < -50 || pos.y > h + 50) continue;

    renderer.drawWeatherStation(ctx, station, pos.x, pos.y, {
      canvasWidth: w,
      t,
    });
  }

  // Draw warning indicators
  if (warnings && warnings.length) {
    const theme = renderer.theme;
    const fontSize = Math.max(9, Math.round(w * 0.009));
    ctx.font = `bold ${fontSize}px ${theme.fonts.sans}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    let wy = h - 30;
    for (const warn of warnings.slice(0, 3)) {
      // Warning flag icon
      const flag = renderer.registry.getSymbol(
        warn.severity === 'Severe' ? 'storm-warning' : 'small-craft'
      );
      if (flag) {
        ctx.save();
        ctx.translate(20, wy);
        flag.draw(ctx, 16, theme.colors.creme);
        ctx.restore();
      }
      // Warning text
      ctx.fillStyle = theme.colors.ouro;
      ctx.globalAlpha = 0.8;
      ctx.fillText(warn.event || warn.headline || 'MARINE WARNING', 42, wy - 6);
      ctx.globalAlpha = 1;
      wy -= 22;
    }
  }
}
