import WidgetKit
import SwiftUI
import ActivityKit

// MARK: - Live Activity Attributes
struct FocusTimerAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var elapsedSeconds: Int
        var isPaused: Bool
    }
    
    var taskTitle: String
    var targetSeconds: Int
    var startTime: Date
}

// MARK: - Live Activity Widget
@available(iOS 16.1, *)
struct FocusTimerLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: FocusTimerAttributes.self) { context in
            // Lock screen / banner UI
            FocusTimerLockScreenView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded Dynamic Island
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "timer")
                        .foregroundColor(.green)
                        .font(.title2)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(timerString(from: context.state.elapsedSeconds, target: context.attributes.targetSeconds))
                        .font(.title2)
                        .fontWeight(.bold)
                        .monospacedDigit()
                        .foregroundColor(context.state.elapsedSeconds >= context.attributes.targetSeconds ? .orange : .white)
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.attributes.taskTitle)
                        .font(.headline)
                        .lineLimit(1)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    ProgressView(value: min(Double(context.state.elapsedSeconds) / Double(context.attributes.targetSeconds), 1.0))
                        .progressViewStyle(.linear)
                        .tint(context.state.elapsedSeconds >= context.attributes.targetSeconds ? .orange : .green)
                }
            } compactLeading: {
                Image(systemName: context.state.isPaused ? "pause.fill" : "timer")
                    .foregroundColor(.green)
            } compactTrailing: {
                Text(timerString(from: context.state.elapsedSeconds, target: context.attributes.targetSeconds))
                    .font(.caption)
                    .fontWeight(.semibold)
                    .monospacedDigit()
            } minimal: {
                Image(systemName: "timer")
                    .foregroundColor(.green)
            }
        }
    }
    
    private func timerString(from elapsed: Int, target: Int) -> String {
        let remaining = max(target - elapsed, 0)
        if elapsed >= target {
            // Show overtime
            let overtime = elapsed - target
            let mins = overtime / 60
            let secs = overtime % 60
            return "+\(mins):\(String(format: "%02d", secs))"
        }
        let mins = remaining / 60
        let secs = remaining % 60
        return "\(mins):\(String(format: "%02d", secs))"
    }
}

// MARK: - Lock Screen View
@available(iOS 16.1, *)
struct FocusTimerLockScreenView: View {
    let context: ActivityViewContext<FocusTimerAttributes>
    
    var body: some View {
        HStack(spacing: 16) {
            // Timer circle
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.3), lineWidth: 4)
                    .frame(width: 50, height: 50)
                
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(progressColor, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                    .frame(width: 50, height: 50)
                    .rotationEffect(.degrees(-90))
                
                Image(systemName: context.state.isPaused ? "pause.fill" : "timer")
                    .foregroundColor(progressColor)
                    .font(.system(size: 18, weight: .semibold))
            }
            
            // Task info
            VStack(alignment: .leading, spacing: 4) {
                Text(context.attributes.taskTitle)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .lineLimit(1)
                
                Text(context.state.isPaused ? "Paused" : "Focusing")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            // Timer display
            VStack(alignment: .trailing, spacing: 2) {
                Text(timerDisplay)
                    .font(.system(size: 28, weight: .bold, design: .monospaced))
                    .foregroundColor(isOvertime ? .orange : .primary)
                
                Text(isOvertime ? "overtime" : "remaining")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(16)
        .background(Color(UIColor.secondarySystemBackground))
    }
    
    private var progress: CGFloat {
        min(CGFloat(context.state.elapsedSeconds) / CGFloat(context.attributes.targetSeconds), 1.0)
    }
    
    private var progressColor: Color {
        if context.state.isPaused { return .yellow }
        if isOvertime { return .orange }
        return .green
    }
    
    private var isOvertime: Bool {
        context.state.elapsedSeconds >= context.attributes.targetSeconds
    }
    
    private var timerDisplay: String {
        let elapsed = context.state.elapsedSeconds
        let target = context.attributes.targetSeconds
        
        if elapsed >= target {
            let overtime = elapsed - target
            let mins = overtime / 60
            let secs = overtime % 60
            return "+\(mins):\(String(format: "%02d", secs))"
        }
        
        let remaining = target - elapsed
        let mins = remaining / 60
        let secs = remaining % 60
        return "\(mins):\(String(format: "%02d", secs))"
    }
}

// MARK: - Widget Bundle
@main
struct FocusTimerWidgetBundle: WidgetBundle {
    var body: some Widget {
        if #available(iOS 16.1, *) {
            FocusTimerLiveActivity()
        }
    }
}
