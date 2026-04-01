const computePXSize = ({ percent, width, coefficient = 1, }) => {
    return `${(width / 100) * (percent / 100) * coefficient}px`;
};
export default computePXSize;
//# sourceMappingURL=computePXSize.js.map