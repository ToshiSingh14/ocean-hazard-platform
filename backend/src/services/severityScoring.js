function calculateSeverity({ confidence = 0, reportCount = 1 } = {}) {
  const score = Number(confidence);
  const count = Number(reportCount);

  if (
    !Number.isFinite(score) ||
    score < 0 ||
    score > 1 ||
    !Number.isFinite(count) ||
    count < 1
  ) {
    throw new Error('Invalid confidence or report count');
  }

  if (score >= 0.9 && count >= 10) return 'critical';
  if (score >= 0.75 && count >= 5) return 'high';
  if (score >= 0.5) return 'medium';

  return 'low';
}

module.exports = { calculateSeverity };
