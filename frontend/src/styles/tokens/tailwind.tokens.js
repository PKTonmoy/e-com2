const tokens = require('./design_tokens.json');

module.exports = {
    theme: {
        extend: {
            colors: {
                primary: tokens.tokens.colors.primary,
                secondary: tokens.tokens.colors.secondary,
                neutral: tokens.tokens.colors.neutral,
                ...tokens.tokens.colors.semantic
            },
            fontFamily: tokens.tokens.typography.fontFamily,
            fontSize: tokens.tokens.typography.fontSize,
            borderRadius: tokens.tokens.radii,
            boxShadow: tokens.tokens.elevation,
            spacing: tokens.tokens.spacing
        }
    }
};
