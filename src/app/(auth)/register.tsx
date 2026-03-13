import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { Ionicons } from "@expo/vector-icons";
import { setToken as setTokenInStorage, saveUser } from "@/services/tokenStorage";
import { colors, theme } from "@/constants/theme";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/authStore";

interface RegisterForm {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const TOKEN_KEY = "naivolt_token";

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setApiError(null);
    if (!data.fullName?.trim()) {
      setError("fullName", { message: "Full name is required" });
      return;
    }
    if (!data.username?.trim()) {
      setError("username", { message: "Username is required" });
      return;
    }
    if (data.username.trim().length < 3) {
      setError("username", { message: "Username must be at least 3 characters" });
      return;
    }
    if (!data.email?.trim()) {
      setError("email", { message: "Email is required" });
      return;
    }
    if (!data.phone?.trim()) {
      setError("phone", { message: "Phone is required" });
      return;
    }
    if (!data.password || data.password.length < 6) {
      setError("password", { message: "Password must be at least 6 characters" });
      return;
    }
    if (data.password !== data.confirmPassword) {
      setError("confirmPassword", { message: "Passwords do not match" });
      return;
    }

    try {
      const res = await api.post<{
        token: string;
        user: {
          _id?: string;
          id?: string;
          name: string;
          username?: string;
          email: string;
          phone?: string;
          role?: string;
        };
      }>("/auth/register", {
        name: data.fullName,
        username: data.username.trim().toLowerCase(),
        email: data.email,
        phone: data.phone,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      const { token, user } = res.data;
      if (token && user) {
        try {
          await setTokenInStorage(TOKEN_KEY, token);
        } catch {
          // Storage failed (e.g. Expo Go); token may be in memory only
        }
        const userPayload = {
          _id: user._id ?? user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role as "user" | "admin" | undefined,
        };
        setToken(token);
        setUser(userPayload);
        await saveUser(userPayload);
        if (user.role === "admin") {
          router.replace("/(admin)/dashboard");
        } else {
          router.replace("/(tabs)");
        }
      }
    } catch (err: unknown) {
      let message = "Something went wrong. Please try again.";
      if (err && typeof err === "object" && "response" in err) {
        const res = (err as { response?: { data?: unknown; status?: number } })
          .response;
        const data = res?.data as Record<string, string> | undefined;
        message =
          data?.message ||
          data?.error ||
          data?.msg ||
          (res?.status === 404 || res?.status === 502
            ? "Cannot reach server. Is the backend running? Use your computer IP (e.g. http://192.168.x.x:5000) if on a device."
            : message);
      } else if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof (err as Error).message === "string"
      ) {
        const msg = (err as Error).message;
        if (msg.includes("timeout") || msg.includes("ECONNABORTED"))
          message =
            "Request timed out. Check your connection and that the backend is running.";
        else if (msg.includes("Network Error") || msg.includes("ECONNREFUSED"))
          message =
            "Cannot connect to server. Is the backend running? On Android emulator set EXPO_PUBLIC_API_URL=http://10.0.2.2:5000; on a physical device use your computer IP (e.g. http://192.168.1.1:5000).";
        else message = msg;
      }
      setApiError(message);
    }
  };

  const inputBorder = (fieldName: string) =>
    focusedField === fieldName ? colors.primaryAccent : colors.border;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back arrow */}
          <Pressable
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primaryText} />
          </Pressable>

          <Text style={styles.heading}>Create Account</Text>
          <Text style={styles.subtext}>
            Join Naivolt and start converting crypto to Naira
          </Text>

          <View style={styles.form}>
            <Controller
              control={control}
              name="fullName"
              render={({ field }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.secondaryText}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={() => {
                      field.onBlur();
                      setFocusedField(null);
                    }}
                    onFocus={() => setFocusedField("fullName")}
                    style={[
                      styles.input,
                      { borderColor: inputBorder("fullName") },
                    ]}
                    cursorColor={colors.primaryAccent}
                    selectionColor={colors.primaryAccent}
                    underlineColorAndroid="transparent"
                  />
                  {errors.fullName ? (
                    <Text style={styles.inlineError}>
                      {errors.fullName.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={control}
              name="username"
              render={({ field }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Username</Text>
                  <TextInput
                    placeholder="3–30 characters, e.g. johndoe"
                    placeholderTextColor={colors.secondaryText}
                    value={field.value}
                    onChangeText={(text) => field.onChange(text)}
                    onBlur={() => {
                      field.onBlur();
                      setFocusedField(null);
                    }}
                    onFocus={() => setFocusedField("username")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      styles.input,
                      { borderColor: inputBorder("username") },
                    ]}
                    cursorColor={colors.primaryAccent}
                    selectionColor={colors.primaryAccent}
                    underlineColorAndroid="transparent"
                  />
                  {errors.username ? (
                    <Text style={styles.inlineError}>
                      {errors.username.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor={colors.secondaryText}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={() => {
                      field.onBlur();
                      setFocusedField(null);
                    }}
                    onFocus={() => setFocusedField("email")}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      styles.input,
                      { borderColor: inputBorder("email") },
                    ]}
                    cursorColor={colors.primaryAccent}
                    selectionColor={colors.primaryAccent}
                    underlineColorAndroid="transparent"
                  />
                  {errors.email ? (
                    <Text style={styles.inlineError}>
                      {errors.email.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    placeholder="e.g 08012345678"
                    placeholderTextColor={colors.secondaryText}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={() => {
                      field.onBlur();
                      setFocusedField(null);
                    }}
                    onFocus={() => setFocusedField("phone")}
                    keyboardType="phone-pad"
                    style={[
                      styles.input,
                      { borderColor: inputBorder("phone") },
                    ]}
                    cursorColor={colors.primaryAccent}
                    selectionColor={colors.primaryAccent}
                    underlineColorAndroid="transparent"
                  />
                  {errors.phone ? (
                    <Text style={styles.inlineError}>
                      {errors.phone.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Password</Text>
                  <View
                    style={[
                      styles.inputRow,
                      { borderColor: inputBorder("password") },
                    ]}
                  >
                    <TextInput
                      placeholder="Minimum 6 characters"
                      placeholderTextColor={colors.secondaryText}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={() => {
                        field.onBlur();
                        setFocusedField(null);
                      }}
                      onFocus={() => setFocusedField("password")}
                      secureTextEntry={!showPassword}
                      style={styles.inputInner}
                      cursorColor={colors.primaryAccent}
                      selectionColor={colors.primaryAccent}
                      underlineColorAndroid="transparent"
                    />
                    <Pressable
                      onPress={() => setShowPassword((p) => !p)}
                      hitSlop={8}
                      style={styles.eyeBtn}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color={colors.secondaryText}
                      />
                    </Pressable>
                  </View>
                  {errors.password ? (
                    <Text style={styles.inlineError}>
                      {errors.password.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View
                    style={[
                      styles.inputRow,
                      { borderColor: inputBorder("confirmPassword") },
                    ]}
                  >
                    <TextInput
                      placeholder="Re-enter your password"
                      placeholderTextColor={colors.secondaryText}
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={() => {
                        field.onBlur();
                        setFocusedField(null);
                      }}
                      onFocus={() => setFocusedField("confirmPassword")}
                      secureTextEntry={!showConfirmPassword}
                      style={styles.inputInner}
                      cursorColor={colors.primaryAccent}
                      selectionColor={colors.primaryAccent}
                      underlineColorAndroid="transparent"
                    />
                    <Pressable
                      onPress={() => setShowConfirmPassword((p) => !p)}
                      hitSlop={8}
                      style={styles.eyeBtn}
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={22}
                        color={colors.secondaryText}
                      />
                    </Pressable>
                  </View>
                  {errors.confirmPassword ? (
                    <Text style={styles.inlineError}>
                      {errors.confirmPassword.message}
                    </Text>
                  ) : null}
                </View>
              )}
            />

            {apiError ? <Text style={styles.apiError}>{apiError}</Text> : null}

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator
                  color={colors.buttonTextOnAccent}
                  size="small"
                />
              ) : (
                <Text style={styles.submitBtnText}>Create Account</Text>
              )}
            </TouchableOpacity>
            <View style={styles.loginRow}>
              <Text style={styles.loginPrompt}>Already have an account?</Text>
              <Pressable
                onPress={() => router.push("/login")}
                style={({ pressed }) => [styles.loginLinkTouch, pressed && { opacity: 0.8 }]}
                hitSlop={{ top: 16, bottom: 16, left: 12, right: 12 }}
              >
                <Text style={styles.loginLink}>Login</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.primaryBackground,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  backBtn: {
    alignSelf: "flex-start",
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.primaryText,
    marginBottom: theme.spacing.xs,
  },
  subtext: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: theme.spacing.lg,
  },
  form: {
    marginBottom: theme.spacing.lg,
  },
  field: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 12,
    color: colors.secondaryText,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 12,
    color: colors.primaryText,
    fontSize: 16,
    padding: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 12,
    paddingRight: 12,
    overflow: "hidden",
  },
  inputInner: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 0,
    color: colors.primaryText,
    fontSize: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  eyeBtn: {
    padding: 4,
  },
  inlineError: {
    fontSize: 12,
    color: colors.error,
    marginTop: theme.spacing.xs,
  },
  apiError: {
    fontSize: 12,
    color: colors.error,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  submitBtn: {
    backgroundColor: colors.primaryAccent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    marginTop: theme.spacing.lg,
  },
  submitBtnDisabled: {
    opacity: 0.8,
  },
  submitBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.buttonTextOnAccent,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: theme.spacing.lg,
    minHeight: 48,
  },
  loginPrompt: {
    fontSize: 16,
    color: colors.secondaryText,
  },
  loginLinkTouch: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  loginLink: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.primaryAccent,
  },
});
