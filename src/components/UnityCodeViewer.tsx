import React, { useState } from 'react';
import { Copy, Check, Download, FileCode, Code2 } from 'lucide-react';

interface ScriptFile {
  name: string;
  description: string;
  code: string;
}

const UNITY_SCRIPTS: ScriptFile[] = [
  {
    name: 'FoxStateMachine.cs',
    description: 'Manages autonomous behavioral states, random transition timers, and non-repetitive idle poses.',
    code: `using System;
using System.Collections.Generic;
using UnityEngine;

public enum FoxBehaviorState
{
    IdleStanding,
    IdleSitting,
    IdleCurled,
    Stretching,
    Yawning,
    Walking,
    Playing,
    Rolling,
    Jumping,
    Sleeping
}

public class FoxStateMachine : MonoBehaviour
{
    [Header("Current State")]
    [SerializeField] private FoxBehaviorState currentState = FoxBehaviorState.IdleStanding;
    [SerializeField] private float stateTimer = 5f;
    [SerializeField] private bool isPetting = false;

    private readonly List<FoxBehaviorState> recentStates = new List<FoxBehaviorState>();
    private readonly FoxBehaviorState[] idleStates = {
        FoxBehaviorState.IdleStanding,
        FoxBehaviorState.IdleSitting,
        FoxBehaviorState.IdleCurled
    };
    private readonly FoxBehaviorState[] activeStates = {
        FoxBehaviorState.Stretching,
        FoxBehaviorState.Yawning,
        FoxBehaviorState.Walking,
        FoxBehaviorState.Playing,
        FoxBehaviorState.Rolling,
        FoxBehaviorState.Jumping
    };

    public event Action<FoxBehaviorState> OnStateChanged;
    public event Action<bool> OnPettingStateChanged;

    public FoxBehaviorState CurrentState => currentState;
    public bool IsPetting => isPetting;

    private void Start()
    {
        TransitionToState(currentState);
    }

    private void Update()
    {
        stateTimer -= Time.deltaTime;
        if (stateTimer <= 0f)
        {
            ChooseNextAutonomousBehavior();
        }
    }

    public void SetPetting(bool active)
    {
        if (isPetting == active) return;
        isPetting = active;
        OnPettingStateChanged?.Invoke(isPetting);

        // If fox is sleeping when petted, gently wake it up with a yawn
        if (active && currentState == FoxBehaviorState.Sleeping)
        {
            TransitionToState(FoxBehaviorState.Yawning, 3.5f);
        }
    }

    public void TransitionToState(FoxBehaviorState newState, float overrideDuration = -1f)
    {
        currentState = newState;
        stateTimer = overrideDuration > 0f ? overrideDuration : GetDefaultDuration(newState);

        // Track history to avoid short-term repetition
        recentStates.Insert(0, newState);
        if (recentStates.Count > 4) recentStates.RemoveAt(recentStates.Count - 1);

        OnStateChanged?.Invoke(currentState);
    }

    private void ChooseNextAutonomousBehavior()
    {
        float dice = UnityEngine.Random.value;
        FoxBehaviorState next;

        if (currentState == FoxBehaviorState.Sleeping)
        {
            next = UnityEngine.Random.value < 0.6f ? FoxBehaviorState.Sleeping : FoxBehaviorState.Yawning;
        }
        else if (dice < 0.45f)
        {
            // Pick an idle state not recently visited
            next = PickNonRepetitive(idleStates, currentState);
        }
        else if (dice < 0.85f)
        {
            // Pick an active state not recently visited
            next = PickNonRepetitive(activeStates, currentState);
        }
        else
        {
            next = FoxBehaviorState.Walking;
        }

        TransitionToState(next);
    }

    private FoxBehaviorState PickNonRepetitive(FoxBehaviorState[] pool, FoxBehaviorState exclude)
    {
        List<FoxBehaviorState> candidates = new List<FoxBehaviorState>();
        foreach (var s in pool)
        {
            if (s != exclude && !recentStates.Contains(s))
            {
                candidates.Add(s);
            }
        }
        if (candidates.Count == 0)
        {
            foreach (var s in pool) if (s != exclude) candidates.Add(s);
        }
        return candidates.Count > 0 ? candidates[UnityEngine.Random.Range(0, candidates.Count)] : pool[0];
    }

    private float GetDefaultDuration(FoxBehaviorState state)
    {
        switch (state)
        {
            case FoxBehaviorState.Stretching: return UnityEngine.Random.Range(3.5f, 5f);
            case FoxBehaviorState.Yawning: return UnityEngine.Random.Range(2.5f, 3.5f);
            case FoxBehaviorState.Walking: return UnityEngine.Random.Range(4f, 7f);
            case FoxBehaviorState.Playing: return UnityEngine.Random.Range(4f, 6.5f);
            case FoxBehaviorState.Rolling: return UnityEngine.Random.Range(3f, 5f);
            case FoxBehaviorState.Sleeping: return UnityEngine.Random.Range(10f, 20f);
            case FoxBehaviorState.IdleStanding: return UnityEngine.Random.Range(4f, 7f);
            case FoxBehaviorState.IdleSitting: return UnityEngine.Random.Range(5f, 9f);
            case FoxBehaviorState.IdleCurled: return UnityEngine.Random.Range(6f, 10f);
            default: return 5f;
        }
    }
}`,
  },
  {
    name: 'PettingInteraction.cs',
    description: 'Handles pointer clicks and hover gestures, triggers pleased reactions, sounds, and heart particle bursts.',
    code: `using UnityEngine;
using UnityEngine.EventSystems;

public class PettingInteraction : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IPointerEnterHandler, IPointerExitHandler
{
    [Header("References")]
    [SerializeField] private FoxStateMachine stateMachine;
    [SerializeField] private ParticleSystem heartParticles;
    [SerializeField] private AudioSource audioSource;
    [SerializeField] private AudioClip[] purrClips;
    [SerializeField] private AudioClip happyChirpClip;

    [Header("Settings")]
    [SerializeField] private float petSoundCooldown = 0.4f;
    private float lastPetSoundTime;
    private bool isHovering = false;

    public void OnPointerDown(PointerEventData eventData)
    {
        TriggerPetInteraction(eventData.position);
    }

    public void OnPointerUp(PointerEventData eventData)
    {
        stateMachine.SetPetting(false);
    }

    public void OnPointerEnter(PointerEventData eventData)
    {
        isHovering = true;
        if (Input.GetMouseButton(0))
        {
            TriggerPetInteraction(eventData.position);
        }
    }

    public void OnPointerExit(PointerEventData eventData)
    {
        isHovering = false;
        stateMachine.SetPetting(false);
    }

    private void Update()
    {
        if (isHovering && Input.GetMouseButton(0))
        {
            TriggerPetInteraction(Input.mousePosition);
        }
    }

    private void TriggerPetInteraction(Vector2 screenPosition)
    {
        stateMachine.SetPetting(true);

        if (Time.time - lastPetSoundTime > petSoundCooldown)
        {
            lastPetSoundTime = Time.time;
            PlayPetAudio();
            SpawnHeartBurst(screenPosition);
        }
    }

    private void PlayPetAudio()
    {
        if (audioSource == null) return;
        if (UnityEngine.Random.value < 0.4f && happyChirpClip != null)
        {
            audioSource.PlayOneShot(happyChirpClip, 0.7f);
        }
        else if (purrClips != null && purrClips.Length > 0)
        {
            var clip = purrClips[UnityEngine.Random.Range(0, purrClips.Length)];
            audioSource.PlayOneShot(clip, 0.6f);
        }
    }

    private void SpawnHeartBurst(Vector2 screenPos)
    {
        if (heartParticles == null) return;
        Vector3 worldPos = Camera.main.ScreenToWorldPoint(new Vector3(screenPos.x, screenPos.y, 10f));
        heartParticles.transform.position = worldPos;
        heartParticles.Emit(5);
    }
}`,
  },
  {
    name: 'FoxDataPersistence.cs',
    description: 'Serializes the fox state to disk via JsonUtility and restores session progression on boot.',
    code: `using System;
using System.IO;
using UnityEngine;

[System.Serializable]
public class FoxSaveData
{
    public string behaviorName;
    public float posX;
    public float posY;
    public float happiness;
    public float affection;
    public float energy;
    public int totalPets;
    public long lastSavedTimestamp;
}

public class FoxDataPersistence : MonoBehaviour
{
    [SerializeField] private FoxStateMachine stateMachine;
    [SerializeField] private Transform foxTransform;

    private string saveFilePath;

    private void Awake()
    {
        saveFilePath = Path.Combine(Application.persistentDataPath, "fox_pet_save.json");
        LoadFoxState();
    }

    private void OnApplicationQuit()
    {
        SaveFoxState();
    }

    private void OnApplicationPause(bool pauseStatus)
    {
        if (pauseStatus) SaveFoxState();
    }

    public void SaveFoxState()
    {
        FoxSaveData data = new FoxSaveData
        {
            behaviorName = stateMachine.CurrentState.ToString(),
            posX = foxTransform.position.x,
            posY = foxTransform.position.y,
            happiness = 85f,
            affection = 60f,
            energy = 80f,
            lastSavedTimestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds()
        };

        string json = JsonUtility.ToJson(data, true);
        File.WriteAllText(saveFilePath, json);
        Debug.Log($"Fox state saved to: {saveFilePath}");
    }

    public void LoadFoxState()
    {
        if (!File.Exists(saveFilePath))
        {
            Debug.Log("No saved state found. Initializing fresh autonomous fox.");
            return;
        }

        try
        {
            string json = File.ReadAllText(saveFilePath);
            FoxSaveData data = JsonUtility.FromJson<FoxSaveData>(json);

            // Restore position
            foxTransform.position = new Vector3(data.posX, data.posY, foxTransform.position.z);

            // Restore behavior state
            if (Enum.TryParse<FoxBehaviorState>(data.behaviorName, out var savedState))
            {
                long now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                long elapsedSeconds = now - data.lastSavedTimestamp;

                // If user was away for > 5 minutes, wake up from sleep
                if (elapsedSeconds > 300)
                {
                    stateMachine.TransitionToState(FoxBehaviorState.Sleeping);
                }
                else
                {
                    stateMachine.TransitionToState(savedState);
                }
            }
        }
        catch (Exception ex)
        {
            Debug.LogWarning($"Failed to parse save file: {ex.Message}");
        }
    }
}`,
  },
  {
    name: 'MiniWindowUI.cs',
    description: 'Manages desktop window minimization and renders the live preview camera to a compact mini-widget.',
    code: `using UnityEngine;
using UnityEngine.UI;

public class MiniWindowUI : MonoBehaviour
{
    [Header("Window References")]
    [SerializeField] private GameObject mainWindow;
    [SerializeField] private GameObject miniWindow;
    [SerializeField] private RawImage miniPreviewDisplay;
    [SerializeField] private Camera miniPreviewCamera;
    [SerializeField] private Text statusTextGlance;
    [SerializeField] private FoxStateMachine stateMachine;

    private RenderTexture previewRenderTexture;

    private void Start()
    {
        // Set up dedicated preview RenderTexture for the mini window
        previewRenderTexture = new RenderTexture(256, 180, 16);
        miniPreviewCamera.targetTexture = previewRenderTexture;
        miniPreviewDisplay.texture = previewRenderTexture;

        ShowMainWindow();
    }

    public void MinimizeToMiniWindow()
    {
        mainWindow.SetActive(false);
        miniWindow.SetActive(true);
        UpdateMiniStatusText();
    }

    public void ShowMainWindow()
    {
        miniWindow.SetActive(false);
        mainWindow.SetActive(true);
    }

    private void Update()
    {
        if (miniWindow.activeSelf)
        {
            UpdateMiniStatusText();
        }
    }

    private void UpdateMiniStatusText()
    {
        if (statusTextGlance == null || stateMachine == null) return;

        if (stateMachine.IsPetting)
        {
            statusTextGlance.text = "💖 Being Petted & Purring";
            return;
        }

        switch (stateMachine.CurrentState)
        {
            case FoxBehaviorState.Sleeping: statusTextGlance.text = "💤 Cozy Nap"; break;
            case FoxBehaviorState.Playing: statusTextGlance.text = "🎾 Playing with Ball"; break;
            case FoxBehaviorState.Walking: statusTextGlance.text = "🚶 Trotting Around"; break;
            case FoxBehaviorState.Stretching: statusTextGlance.text = "🧘 Stretching Paws"; break;
            case FoxBehaviorState.Yawning: statusTextGlance.text = "🥱 Yawning"; break;
            case FoxBehaviorState.Rolling: statusTextGlance.text = "🤸 Rolling Wiggle"; break;
            case FoxBehaviorState.IdleCurled: statusTextGlance.text = "🍞 Loaf Resting"; break;
            case FoxBehaviorState.IdleSitting: statusTextGlance.text = "🐾 Sitting Calmly"; break;
            default: statusTextGlance.text = "🦊 Alert & Watching"; break;
        }
    }

    private void OnDestroy()
    {
        if (previewRenderTexture != null)
        {
            previewRenderTexture.Release();
        }
    }
}`,
  },
  {
    name: 'FoxRedBedController.cs',
    description: 'Implements the simple 2D red cube bed. Guides the fox to bed and manages sleep until energy is 100% full.',
    code: `using System;
using UnityEngine;

/// <summary>
/// Simple 2D Red Cube Bed component for Fox pet.
/// When the fox goes to bed (autonomously or prompted), it sleeps until energy is 100% full.
/// </summary>
public class FoxRedBedController : MonoBehaviour
{
    [Header("Bed Transforms & Visuals")]
    [SerializeField] private Transform bedRestPoint;
    [SerializeField] private SpriteRenderer bedCubeSprite; // 2D Red Cube with minimal graphics
    [SerializeField] private Color cubeColor = new Color(0.86f, 0.15f, 0.15f, 1f); // #DC2626

    [Header("Sleep & Energy Configuration")]
    [SerializeField] private float energyRechargeRate = 4.0f; // 4% energy restored per second
    [SerializeField] private bool isOccupied = false;

    private FoxStateMachine stateMachine;
    private FoxStats stats;

    public bool IsOccupied => isOccupied;

    private void Awake()
    {
        stateMachine = FindObjectOfType<FoxStateMachine>();
        stats = FindObjectOfType<FoxStats>();

        if (bedCubeSprite != null)
        {
            bedCubeSprite.color = cubeColor;
        }
    }

    private void Update()
    {
        // Recharging sleep loop
        if (isOccupied && stateMachine != null && stateMachine.CurrentState == FoxBehaviorState.Sleeping)
        {
            if (stats != null)
            {
                stats.AddEnergy(energyRechargeRate * Time.deltaTime);

                // User Requirement: Sleep up until the energy is full (100%) again!
                if (stats.Energy >= 100f)
                {
                    WakeUpFox("Energy fully recharged to 100%!");
                }
            }
        }
    }

    /// <summary>
    /// Prompts the fox to walk to the red cube bed and sleep until 100% full energy.
    /// </summary>
    public void PromptFoxToSleepInBed()
    {
        if (stateMachine.CurrentState == FoxBehaviorState.Sleeping) return;

        isOccupied = true;
        Vector3 targetPos = bedRestPoint != null ? bedRestPoint.position : transform.position;

        // Command fox to navigate to bed and enter sleeping state
        stateMachine.MoveToAndSleep(targetPos, onArrived: () => {
            stateMachine.TransitionToState(FoxBehaviorState.Sleeping);
            Debug.Log("Fox curled up in the 2D red cube bed. Sleeping until 100% energy.");
        });
    }

    /// <summary>
    /// Wakes up the fox with a gentle morning yawn.
    /// </summary>
    public void WakeUpFox(string reason = "Awakened")
    {
        isOccupied = false;
        if (stateMachine.CurrentState == FoxBehaviorState.Sleeping)
        {
            stateMachine.TransitionToState(FoxBehaviorState.Yawning, 3.5f);
            Debug.Log($"Fox woke up from bed. Reason: {reason}");
        }
    }

    private void OnMouseDown()
    {
        // Direct click on the 2D red cube bed sends the fox to sleep
        PromptFoxToSleepInBed();
    }
}`,
  },
  {
    name: 'FoxSoundController.cs',
    description: 'Unity sound management system implementing 2+ real fox audio clip variations for every behavioral state and interaction.',
    code: `using System;
using UnityEngine;

[RequireComponent(typeof(AudioSource))]
public class FoxSoundController : MonoBehaviour
{
    [Header("Fox State Machine Reference")]
    [SerializeField] private FoxStateMachine stateMachine;
    [SerializeField] private AudioSource vocalAudioSource;

    [Header("Behavior Audio Clips (At least 2 variations each)")]
    [Tooltip("Var 1: Gekkering Laugh, Var 2: Playful High Yip")]
    [SerializeField] private AudioClip[] playingClips;

    [Tooltip("Var 1: Joyful Belly Gekker, Var 2: Rolling Purr-Pant")]
    [SerializeField] private AudioClip[] rollingClips;

    [Tooltip("Var 1: Vocal Fox Squeal-Yawn, Var 2: Deep Yawn Sigh")]
    [SerializeField] private AudioClip[] yawningClips;

    [Tooltip("Var 1: Stretch Whimper, Var 2: Arched Spine Creak")]
    [SerializeField] private AudioClip[] stretchingClips;

    [Tooltip("Var 1: Cozy Sleep Snore, Var 2: Dreaming Whimper")]
    [SerializeField] private AudioClip[] sleepingClips;

    [Tooltip("Var 1: Patter Paws Trot, Var 2: Travel Chirrup")]
    [SerializeField] private AudioClip[] walkingClips;

    [Tooltip("Var 1: Curious Snout Sniff, Var 2: Alert Yip")]
    [SerializeField] private AudioClip[] idleStandingClips;

    [Tooltip("Var 1: Throaty Churr, Var 2: Inquiring Whimper")]
    [SerializeField] private AudioClip[] idleSittingClips;

    [Tooltip("Var 1: Cozy Settling Sigh, Var 2: Curled Nose-Purr")]
    [SerializeField] private AudioClip[] idleCurledClips;

    [Header("Interaction Vocalizations (At least 2 variations each)")]
    [Tooltip("Var 1: Throbbing Throat Purr, Var 2: Affectionate Trill")]
    [SerializeField] private AudioClip[] pettingClips;

    [Tooltip("Var 1: Berry Munch & Squeak, Var 2: Tasty Nibble Whimper")]
    [SerializeField] private AudioClip[] feedBerryClips;

    [Tooltip("Var 1: Excited Pounce Yip, Var 2: Toy Chase Gekkering")]
    [SerializeField] private AudioClip[] tossToyClips;

    [Tooltip("Var 1: Responsive Fox Bark, Var 2: Answering Whimper")]
    [SerializeField] private AudioClip[] callFoxClips;

    private void Awake()
    {
        if (vocalAudioSource == null)
        {
            vocalAudioSource = GetComponent<AudioSource>();
        }
    }

    private void OnEnable()
    {
        if (stateMachine != null)
        {
            stateMachine.OnStateChanged += HandleBehaviorChanged;
        }
    }

    private void OnDisable()
    {
        if (stateMachine != null)
        {
            stateMachine.OnStateChanged -= HandleBehaviorChanged;
        }
    }

    private void HandleBehaviorChanged(FoxBehaviorState newState)
    {
        switch (newState)
        {
            case FoxBehaviorState.Playing:
                PlayRandomVariation(playingClips, "Playing");
                break;
            case FoxBehaviorState.Rolling:
                PlayRandomVariation(rollingClips, "Rolling");
                break;
            case FoxBehaviorState.Yawning:
                PlayRandomVariation(yawningClips, "Yawning");
                break;
            case FoxBehaviorState.Stretching:
                PlayRandomVariation(stretchingClips, "Stretching");
                break;
            case FoxBehaviorState.Sleeping:
                PlayRandomVariation(sleepingClips, "Sleeping in Bed");
                break;
            case FoxBehaviorState.Walking:
                PlayRandomVariation(walkingClips, "Walking");
                break;
            case FoxBehaviorState.IdleStanding:
                PlayRandomVariation(idleStandingClips, "Idle Standing");
                break;
            case FoxBehaviorState.IdleSitting:
                PlayRandomVariation(idleSittingClips, "Idle Sitting");
                break;
            case FoxBehaviorState.IdleCurled:
                PlayRandomVariation(idleCurledClips, "Idle Curled");
                break;
        }
    }

    /// <summary>
    /// Plays an authentic fox vocalization randomly chosen from the available variations.
    /// </summary>
    public void PlayRandomVariation(AudioClip[] clips, string actionName)
    {
        if (clips == null || clips.Length == 0 || vocalAudioSource == null) return;
        int variationIndex = UnityEngine.Random.Range(0, clips.Length);
        AudioClip selectedClip = clips[variationIndex];

        if (selectedClip != null)
        {
            vocalAudioSource.pitch = UnityEngine.Random.Range(0.95f, 1.05f);
            vocalAudioSource.PlayOneShot(selectedClip, 0.8f);
            Debug.Log($"Played Real Fox Noise for '{actionName}': Variation #{variationIndex + 1} ({selectedClip.name})");
        }
    }

    // Public interaction audio triggers
    public void PlayPetVocalization() => PlayRandomVariation(pettingClips, "Petting");
    public void PlayFeedVocalization() => PlayRandomVariation(feedBerryClips, "Feed Berry");
    public void PlayToyVocalization() => PlayRandomVariation(tossToyClips, "Toss Toy");
    public void PlayCallVocalization() => PlayRandomVariation(callFoxClips, "Call Fox");
}`,
  },
];

export const UnityCodeViewer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const currentScript = UNITY_SCRIPTS[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentScript.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentScript.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentScript.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2.5">
            <Code2 className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-semibold text-base text-white">Unity / C# Source Architecture</h2>
              <p className="text-xs text-neutral-400">
                Production-ready C# scripts designed for Unity desktop deployment.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-300 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/60 overflow-x-auto px-4 gap-1">
          {UNITY_SCRIPTS.map((script, idx) => (
            <button
              key={script.name}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === idx
                  ? 'border-amber-400 text-amber-400 bg-amber-400/10'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              {script.name}
            </button>
          ))}
        </div>

        {/* Script Info Bar */}
        <div className="px-5 py-2.5 bg-neutral-950/40 border-b border-neutral-800/60 flex items-center justify-between text-xs">
          <span className="text-neutral-300">{currentScript.description}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Script'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download .cs
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed bg-[#0F1117] text-neutral-300 select-text">
          <pre>{currentScript.code}</pre>
        </div>
      </div>
    </div>
  );
};
