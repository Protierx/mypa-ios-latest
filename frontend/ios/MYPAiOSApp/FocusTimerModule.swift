import Foundation
import ActivityKit

@available(iOS 16.1, *)
@objc(FocusTimerModule)
class FocusTimerModule: NSObject {
    
    private var currentActivity: Activity<FocusTimerAttributes>?
    
    @objc
    func startLiveActivity(_ taskTitle: String, targetMinutes: Int, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            rejecter("LIVE_ACTIVITY_DISABLED", "Live Activities are not enabled", nil)
            return
        }
        
        // End any existing activity
        Task {
            for activity in Activity<FocusTimerAttributes>.activities {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
        }
        
        let attributes = FocusTimerAttributes(
            taskTitle: taskTitle,
            targetSeconds: targetMinutes * 60,
            startTime: Date()
        )
        
        let initialState = FocusTimerAttributes.ContentState(
            elapsedSeconds: 0,
            isPaused: false
        )
        
        do {
            let activity = try Activity.request(
                attributes: attributes,
                contentState: initialState,
                pushType: nil
            )
            currentActivity = activity
            resolver(activity.id)
        } catch {
            rejecter("LIVE_ACTIVITY_ERROR", error.localizedDescription, error)
        }
    }
    
    @objc
    func updateLiveActivity(_ elapsedSeconds: Int, isPaused: Bool, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        
        guard let activity = currentActivity else {
            rejecter("NO_ACTIVITY", "No active Live Activity", nil)
            return
        }
        
        let updatedState = FocusTimerAttributes.ContentState(
            elapsedSeconds: elapsedSeconds,
            isPaused: isPaused
        )
        
        Task {
            await activity.update(using: updatedState)
            resolver(true)
        }
    }
    
    @objc
    func endLiveActivity(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        
        Task {
            // End all focus timer activities
            for activity in Activity<FocusTimerAttributes>.activities {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
            currentActivity = nil
            resolver(true)
        }
    }
    
    @objc
    func isLiveActivitySupported(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        if #available(iOS 16.1, *) {
            resolver(ActivityAuthorizationInfo().areActivitiesEnabled)
        } else {
            resolver(false)
        }
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
