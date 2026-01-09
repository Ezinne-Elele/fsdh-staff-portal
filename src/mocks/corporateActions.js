const ACTION_TYPES = ['dividend', 'bonus', 'split', 'rights'];
const SOURCES = ['SWIFT', 'NGX', 'FMDQ', 'AFEX'];
const STATUS_POOL = ['pending', 'active', 'closed'];
const ASSET_TYPES = ['equity', 'bond', 'commodity', 'derivative', 'alternative'];

export function randomCorporateActionId() {
  return `CA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function generateMockCorporateActions(count = 8) {
  return Array.from({ length: count }, () => generateMockCorporateAction());
}

export function generateMockCorporateAction(overrides = {}) {
  const type = ACTION_TYPES[Math.floor(Math.random() * ACTION_TYPES.length)];
  const status = STATUS_POOL[Math.floor(Math.random() * STATUS_POOL.length)];
  const isin = `NG${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`;
  const assetType = ASSET_TYPES[Math.floor(Math.random() * ASSET_TYPES.length)];
  const today = new Date();
  const exDate = new Date(today.getTime() + Math.random() * 7 * 86400000);
  const paymentDate = new Date(exDate.getTime() + Math.random() * 7 * 86400000);

  return {
    actionId: randomCorporateActionId(),
    actionType: type,
    title: `${type.toUpperCase()} FOR ${isin}`,
    isin,
    assetType,
    source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
    status,
    exDate,
    recordDate: new Date(exDate.getTime() - 86400000),
    paymentDate,
    entitlement: type === 'split' ? '1 for 5' : `${(Math.random() * 3 + 0.5).toFixed(2)} units`,
    electionStatus: status === 'pending' ? 'open' : 'closed',
    ...overrides,
  };
}

