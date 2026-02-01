# Quick Integration Guide - UX/UI Audit Fixes

## 🎯 For Developers: How to Use New Utilities

### 1. Error Handling in API Calls

**Import:**
```typescript
import { handleApiError, showError } from '../utils/errorHandler';
```

**Basic Usage:**
```typescript
try {
  const tasks = await api.getTasks();
  setTasks(tasks);
} catch (error) {
  handleApiError(error, 'Load Tasks', true);
}
```

**With Retry:**
```typescript
const fetchTasks = async () => {
  try {
    const tasks = await api.getTasks();
    setTasks(tasks);
  } catch (error) {
    handleApiError(error, 'Load Tasks', true, fetchTasks);
  }
};

// Call it
fetchTasks();
```

**Manual Error Display:**
```typescript
import { showErrorWithRetry } from '../utils/errorHandler';

try {
  await api.deleteTask(taskId);
} catch (error) {
  showErrorWithRetry(error, () => {
    // Retry delete
    api.deleteTask(taskId);
  }, 'Delete Failed');
}
```

---

### 2. Form Validation

**Import:**
```typescript
import { 
  validateEmail, 
  validatePassword, 
  validateTaskForm,
  validateRequired 
} from '../utils/validation';
```

**Email & Password Validation:**
```typescript
const [email, setEmail] = useState('');
const [emailError, setEmailError] = useState<string | null>(null);

const handleEmailChange = (text: string) => {
  setEmail(text);
  const error = validateEmail(text);
  setEmailError(error?.message || null);
};

// Render error
{emailError && <Text style={styles.error}>{emailError}</Text>}
```

**Task Form Validation:**
```typescript
const handleSaveTask = () => {
  const result = validateTaskForm({
    title: taskTitle,
    category: selectedCategory,
    priority: selectedPriority,
  });

  if (!result.isValid) {
    result.errors.forEach(error => {
      console.log(`${error.field}: ${error.message}`);
      // Show field-specific errors in UI
    });
    return;
  }

  // Save task
  saveTask();
};
```

**Generic Required Field:**
```typescript
const error = validateRequired(username, 'Username');
if (error) {
  showError(error.message);
  return;
}
```

---

### 3. Error Boundary Setup

**In App.tsx:**
```typescript
import { ErrorBoundary } from './components';
import { NavigationContainer } from '@react-navigation/native';

export default function App() {
  return (
    <ErrorBoundary 
      onError={(error, errorInfo) => {
        // Optional: Send to error tracking service
        console.error('App Error:', error, errorInfo);
      }}
    >
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </ErrorBoundary>
  );
}
```

**Per-Screen (Optional):**
```typescript
import { ErrorBoundary } from '../../components';

export function HubScreen() {
  return (
    <ErrorBoundary>
      <HubContent />
    </ErrorBoundary>
  );
}

function HubContent() {
  // Screen content
}
```

---

### 4. Loading States

**In Hub/Plan Screens:**
```typescript
import { LoadingOverlay } from '../../components';

export function MyScreen() {
  const { isLoading, data } = useMyData();

  return (
    <View style={styles.container}>
      {/* Your content */}
      
      {/* Loading overlay automatically shows when isLoading is true */}
      {isLoading && <LoadingOverlay />}
    </View>
  );
}
```

**Custom Loading Screen:**
```typescript
function CustomLoadingUI() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#B58CFF" />
      <Text style={styles.loadingText}>Loading your data...</Text>
    </View>
  );
}
```

---

### 5. Accessibility Labels

**Add to All Interactive Elements:**
```typescript
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Complete task"
  accessibilityHint="Double tap to mark task as completed"
  onPress={handleComplete}
>
  <Text>Complete</Text>
</Pressable>
```

**Form Elements:**
```typescript
<TextInput
  accessibilityLabel="Email address input"
  accessibilityHint="Enter your email to sign up"
  placeholder="Enter email"
  value={email}
  onChangeText={setEmail}
/>
```

**Icon Buttons:**
```typescript
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Delete task"
  onPress={handleDelete}
>
  <Trash size={20} color="#EF4444" />
</Pressable>
```

---

### 6. Theme Colors (No More Hardcoded!)

**Import:**
```typescript
import { colors } from '../styles';
import { spacing, radius, shadows } from '../styles/theme';
```

**Instead of:**
```typescript
// ❌ BAD - Hardcoded colors
<LinearGradient colors={['#B58CFF', '#64C7FF']} />
<View style={{ padding: 16, borderRadius: 12 }} />
```

**Do This:**
```typescript
// ✅ GOOD - Using theme tokens
import { colors, spacing, radius } from '../styles';

<LinearGradient colors={[colors.primary, colors.secondary]} />
<View style={{ 
  padding: spacing.base, 
  borderRadius: radius.lg,
  backgroundColor: colors.card,
}} />
```

**Common Tokens:**
```typescript
// Colors
colors.primary        // #B58CFF
colors.secondary      // #64C7FF
colors.success        // #10B981
colors.destructive    // #EF4444
colors.background     // #F6F7FA
colors.card          // #FFFFFF
colors.border        // rgba(0,0,0,0.06)

// Spacing (in pixels)
spacing.xs    // 4
spacing.sm    // 8
spacing.md    // 12
spacing.base  // 16
spacing.lg    // 20
spacing.xl    // 24

// Border radius
radius.sm     // 8
radius.md     // 12
radius.lg     // 18
radius.xl     // 24
radius.full   // 9999

// Shadows
shadows.sm, shadows.md, shadows.lg
```

---

## 🔧 Common Integration Examples

### Example 1: Login Form with Validation & Error Handling

```typescript
import { validateEmail, validatePassword } from '../utils/validation';
import { handleApiError, showError } from '../utils/errorHandler';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validate
    const emailErr = validateEmail(email);
    const pwErr = validatePassword(password);

    setEmailError(emailErr?.message || null);
    setPasswordError(pwErr?.message || null);

    if (emailErr || pwErr) return;

    setLoading(true);

    try {
      const result = await api.login(email, password);
      // Save token, navigate
    } catch (error) {
      handleApiError(error, 'Login Failed', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView>
      <TextInput
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setEmailError(null);
        }}
        placeholder="Email"
        accessibilityLabel="Email input"
      />
      {emailError && <Text style={styles.error}>{emailError}</Text>}

      <TextInput
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setPasswordError(null);
        }}
        placeholder="Password"
        secureTextEntry
        accessibilityLabel="Password input"
      />
      {passwordError && <Text style={styles.error}>{passwordError}</Text>}

      <Button 
        onPress={handleLogin}
        disabled={loading}
        title={loading ? 'Logging in...' : 'Login'}
        accessibilityLabel="Login button"
      />
      
      {loading && <LoadingOverlay />}
    </SafeAreaView>
  );
}
```

### Example 2: Task Completion with Error Handling

```typescript
import { handleApiError } from '../utils/errorHandler';

function TaskCard({ task, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    
    try {
      await api.updateTask(task.id, { completed: !task.completed });
      onUpdate(task.id, { completed: !task.completed });
    } catch (error) {
      handleApiError(error, 'Update Failed', true, handleToggle);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={handleToggle}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={`${task.title}, ${task.completed ? 'completed' : 'not completed'}`}
    >
      <Checkbox checked={task.completed} />
      <Text>{task.title}</Text>
      {loading && <ActivityIndicator />}
    </Pressable>
  );
}
```

---

## 📋 Migration Checklist

- [ ] Add ErrorBoundary to App.tsx root
- [ ] Replace console.error with handleApiError in API calls
- [ ] Add validation to login form
- [ ] Add validation to task creation form
- [ ] Add accessibility labels to Hub screen buttons
- [ ] Add accessibility labels to Plan form elements
- [ ] Replace hardcoded colors in 3+ files with theme
- [ ] Test error messages on slow networks (Slow 3G)
- [ ] Test loading states visible during data fetch
- [ ] Test accessibility with VoiceOver

---

## 🆘 Troubleshooting

**ErrorBoundary not catching errors:**
- Make sure it's at the top level of your app
- It only catches render errors, not async errors

**Validation messages not showing:**
- Make sure you're checking error state after validation
- Add error element to JSX: `{error && <Text>{error}</Text>}`

**Loading overlay not visible:**
- Check z-index: 1000 (should be on top)
- Verify isLoading state is actually true
- Make sure LoadingOverlay is conditionally rendered

**Colors still hardcoded:**
- Import colors from '../styles'
- Use `colors.primary`, `colors.card`, etc.
- Replace all `#XXXXXX` values

---

## 📚 References

- **Colors:** `frontend/src/styles/colors.ts`
- **Theme:** `frontend/src/styles/theme.ts`
- **Error Handler:** `frontend/src/utils/errorHandler.ts`
- **Validation:** `frontend/src/utils/validation.ts`
- **Error Boundary:** `frontend/src/components/ErrorBoundary.tsx`

