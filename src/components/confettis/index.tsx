import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

const AnimatedEmoji = () => {
    const bounceValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const bounceAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(bounceValue, {
                    toValue: -10, // Move up
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(bounceValue, {
                    toValue: 0,    // Move down
                    duration: 300,
                    useNativeDriver: true,
                }),
            ])
        );

        bounceAnimation.start();

        return () => {
            bounceAnimation.stop();
        };
    }, [bounceValue]);

    return (
        <View style={{ position: 'absolute', zIndex: 10, top: '50%', left: '50%', transform: [{ translateX: -45 }, { translateY: -25 }] }}>
            <Animated.Text
                style={{
                    fontSize: 70,
                    transform: [{ translateY: bounceValue }],
                }}
            >
                🏆
            </Animated.Text>
        </View>
    );
};

export default AnimatedEmoji;