import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-audio";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface AudioPlayerProps {
  audioUrl: string | null;
  targetText: string;
  stressPattern?: boolean[] | null;
  chunks?: string[] | null;
}

export default function AudioPlayer({
  audioUrl,
  targetText,
  stressPattern,
  chunks,
}: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAudio, setHasAudio] = useState(audioUrl !== null);

  useEffect(() => {
    setHasAudio(audioUrl !== null);
  }, [audioUrl]);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playSound = async () => {
    if (!audioUrl) return;

    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.replayAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true },
          onPlaybackStatusUpdate,
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.didJustFinish) {
      setIsPlaying(false);
    }
  };

  const renderStressedText = () => {
    if (!stressPattern || stressPattern.length === 0) {
      return <Text style={styles.text}>{targetText}</Text>;
    }

    const words = targetText.split(/\s+/);
    return (
      <Text style={styles.text}>
        {words.map((word, index) => {
          const isStressed = stressPattern[index];
          return (
            <Text key={`${word}-${index}`} style={isStressed ? styles.stressed : styles.unstressed}>
              {word}
              {index < words.length - 1 ? " " : ""}
            </Text>
          );
        })}
      </Text>
    );
  };

  const renderChunkedText = () => {
    if (!chunks || chunks.length === 0) {
      return renderStressedText();
    }

    return (
      <View style={styles.chunkContainer}>
        {chunks.map((chunk, index) => (
          <View key={`chunk-${index}`} style={styles.chunk}>
            {renderTextForChunk(chunk)}
          </View>
        ))}
      </View>
    );
  };

  const renderTextForChunk = (chunkText: string) => {
    if (!stressPattern) {
      return <Text style={styles.text}>{chunkText}</Text>;
    }

    const words = chunkText.split(/\s+/);
    return (
      <Text style={styles.text}>
        {words.map((word, index) => {
          const isStressed = stressPattern[index];
          return (
            <Text key={`${word}-${index}`} style={isStressed ? styles.stressed : styles.unstressed}>
              {word}
              {index < words.length - 1 ? " " : ""}
            </Text>
          );
        })}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.textContent}>{chunks ? renderChunkedText() : renderStressedText()}</View>
      {hasAudio && (
        <Pressable
          onPress={playSound}
          style={[styles.playButton, isPlaying && styles.playButtonActive]}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={32}
            color={isPlaying ? "#fff" : "#007AFF"}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: "center",
  },
  textContent: {
    marginBottom: 16,
    width: "100%",
  },
  text: {
    fontSize: 20,
    lineHeight: 32,
    color: "#000",
    textAlign: "center",
  },
  stressed: {
    fontWeight: "bold",
    color: "#007AFF",
    fontSize: 22,
  },
  unstressed: {
    fontWeight: "normal",
    color: "#000",
  },
  chunkContainer: {
    width: "100%",
  },
  chunk: {
    marginVertical: 8,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E3F2FF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  playButtonActive: {
    backgroundColor: "#007AFF",
  },
});
