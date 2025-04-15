import { Dimensions, PixelRatio } from 'react-native';

export const getScreenSize = () => {
    const { width, height } = Dimensions.get('screen');
    return { width, height }
}

