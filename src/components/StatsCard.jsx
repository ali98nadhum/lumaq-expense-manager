const StatsCard = ({ title, value, icon: Icon, color = 'gold', trend }) => {
    const colorMap = {
        gold: 'var(--accent-gold)',
        purple: 'var(--accent-purple)',
        red: 'var(--accent-red)',
        green: 'var(--accent-green)',
    };

    return (
        <div className="card animate-fade-in">
            <div className="flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h3 style={{ color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>{title}</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {value} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>د.ع</span>
                    </div>
                    {trend && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: trend > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                            {trend > 0 ? '+' : ''}{trend}%
                        </div>
                    )}
                </div>
                <div style={{
                    background: `rgba(255,255,255,0.1)`,
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    color: colorMap[color]
                }}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
};

export default StatsCard;
