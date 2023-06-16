import React from 'react';

const BetaBadge = () => {
  const styles = {

    padding: '0 8px',
    borderRadius: '16px',
    backgroundColor: '#FFFBFA',
    border: '1px solid #FDA29B',
    color: '#B42318',
    fontFamily: 'IBM Plex Sans',
    fontWeight: '600',
    fontSize: '14px',
    marginLeft: '12px'
  };

  return (
    <div style={styles}>
      <span>Beta</span>
    </div>
  );
};

export default BetaBadge;
