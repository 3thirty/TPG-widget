// This file was generated by Dashcode from Apple Inc.
// DO NOT EDIT - This file is maintained automatically by Dashcode.
function setupParts() {
    if (setupParts.called) return;
    setupParts.called = true;
    CreateText('text', {  });
    CreateInfoButton('info', { frontID: 'front', foregroundStyle: 'white', backgroundStyle: 'black', onclick: 'showBack' });
    CreateGlassButton('done', { text: 'Done', onclick: 'showFront' });
    CreateText('text1', { text: 'Username' });
    CreateText('text2', { text: 'Password' });
    CreateHorizontalLevelIndicator('usageIndicator', { maxValue: 18000, onValue: 1, imageWidth: 12, warningValue: 9000, imageHeight: 20, stacked: true, criticalValue: 15000 });
    CreateText('text3', { text: 'Show' });
    CreateHorizontalLevelIndicator('secondaryUsageIndicator', { maxValue: 18000, onValue: 1, imageWidth: 12, warningValue: 9000, imageHeight: 20, stacked: true, criticalValue: 15000 });
    CreateText('usageIndicatorLabel', { text: 'Usage:' });
    CreateText('secondaryUsageIndicatorLabel', { text: 'Off Peak:' });
    CreateText('usageIndicatorValueLabel', { text: '0MB' });
    CreateText('secondaryUsageIndicatorValueLabel', { text: '0MB' });
    CreateText('bragTag', { text: 'By Ethan Smith' });
    CreateText('text4', { text: 'Bandwidth Limits' });
    CreateText('text5', { text: 'Peak' });
    CreateText('text6', { text: 'Off Peak' });
    CreateOvalShape('target', {  });
}
window.addEventListener('load', setupParts, false);