import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorPicker } from '@/components/ui/color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from '@/components/ui/select';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';
import { fetchWorkspaceTheme, updateWorkspaceTheme, resetWorkspaceTheme } from '@/queries/workspaceThemes';
import { hslStringToHex, hexToHslString } from '@/utils/themeColors';
import { THEME_PRESETS, ThemePreset } from '@/utils/themePresets';
import { RotateCcw, Palette } from 'lucide-react';

interface ColorField {
  key: string;
  label: string;
  description: string;
}

const COLOR_FIELDS: ColorField[] = [
  {
    key: 'primary_color',
    label: 'Primary',
    description: 'Main brand color, used for primary buttons and key UI elements',
  },
  {
    key: 'secondary_color',
    label: 'Secondary',
    description: 'Secondary brand color, used for secondary buttons and accents',
  },
  {
    key: 'accent_color',
    label: 'Accent',
    description: 'Accent color, used for highlights and hover states',
  },
  {
    key: 'bg_color',
    label: 'Background',
    description: 'Main page background color',
  },
  {
    key: 'surface_color',
    label: 'Surface',
    description: 'Card and surface background color',
  },
  {
    key: 'text_color',
    label: 'Text',
    description: 'Main text color',
  },
  {
    key: 'muted_color',
    label: 'Muted',
    description: 'Muted background and subtle elements',
  },
  {
    key: 'border_color',
    label: 'Border',
    description: 'Border and divider color',
  },
];

interface ThemeSectionProps {
  isCollapsible?: boolean;
  isOpen?: boolean;
}

export function ThemeSection({ isCollapsible = false, isOpen = true }: ThemeSectionProps = {}) {
  const { currentWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { can } = usePermissions();
  
  // Check both tab-level and component-level permissions
  const canViewTab = can('tab.admin_workspacesetup.view');
  const canEditTab = can('tab.admin_workspacesetup.edit');
  const canViewComponent = can('component.adminworkspacesetup_themecustomization.view');
  const canEditComponent = can('component.adminworkspacesetup_themecustomization.edit');
  
  // Both tab and component permissions required
  const canView = canViewTab && canViewComponent;
  const canEdit = canEditTab && canEditComponent;

  const workspaceId = currentWorkspace?.id;

  // Default HSL values (matches index.css)
  const defaultColors: Record<string, string> = {
    primary_color: '0 0% 9%',
    secondary_color: '0 0% 96%',
    accent_color: '0 0% 15%',
    bg_color: '0 0% 100%',
    surface_color: '0 0% 100%',
    text_color: '215 25% 15%',
    muted_color: '215 15% 92%',
    border_color: '215 15% 88%',
  };

  // State: HSL values (for database storage)
  const [colors, setColors] = useState<Record<string, string>>(defaultColors);
  // State: Hex values (for color inputs)
  const [hexColors, setHexColors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Organize presets into categories
  const whiteThemes = THEME_PRESETS.filter(p => 
    p.name === 'Default' || 
    p.name === 'Slate Professional' ||
    p.name === 'Ocean Blue' ||
    p.name === 'Forest Green' ||
    p.name === 'Royal Purple' ||
    p.name === 'Sunset Warm' ||
    p.name === 'Mint Fresh' ||
    p.name === 'Rose Gold' ||
    p.name === 'Emerald' ||
    p.name === 'Amber' ||
    p.name === 'Crimson'
  );
  const lightThemes = THEME_PRESETS.filter(p => 
    p.name.startsWith('Light')
  );
  const deepThemes = THEME_PRESETS.filter(p => 
    p.name.startsWith('Deep') || p.name === 'Midnight'
  );

  // Load theme from database
  useEffect(() => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchWorkspaceTheme(workspaceId)
      .then((theme) => {
        if (theme) {
          const themeColors: Record<string, string> = {
            primary_color: theme.primary_color,
            secondary_color: theme.secondary_color,
            accent_color: theme.accent_color,
            bg_color: theme.bg_color,
            surface_color: theme.surface_color,
            text_color: theme.text_color,
            muted_color: theme.muted_color,
            border_color: theme.border_color,
          };
          setColors(themeColors);
          
          // Convert HSL to hex for color inputs
          const hex: Record<string, string> = {};
          Object.entries(themeColors).forEach(([key, hsl]) => {
            hex[key] = hslStringToHex(hsl);
          });
          setHexColors(hex);
        } else {
          // Use defaults
          const hex: Record<string, string> = {};
          Object.entries(defaultColors).forEach(([key, hsl]) => {
            hex[key] = hslStringToHex(hsl);
          });
          setHexColors(hex);
        }
      })
      .catch((error) => {
        console.error('Error fetching theme:', error);
        toast.error('Failed to load theme');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [workspaceId]);

  // Handle color change from hex input
  const handleColorChange = (key: string, hexValue: string) => {
    const hslValue = hexToHslString(hexValue);
    setHexColors((prev) => ({ ...prev, [key]: hexValue }));
    setColors((prev) => ({ ...prev, [key]: hslValue }));
    // Clear preset selection when manually changing colors
    setSelectedPreset(null);
  };

  // Apply a preset theme
  const handleApplyPreset = (preset: ThemePreset) => {
    setSelectedPreset(preset.name);
    setColors(preset.colors);
    
    // Convert HSL to hex for color inputs
    const hex: Record<string, string> = {};
    Object.entries(preset.colors).forEach(([key, hsl]) => {
      hex[key] = hslStringToHex(hsl);
    });
    setHexColors(hex);
  };

  // Save theme
  const handleSave = async () => {
    if (!workspaceId || !user?.id) return;

    setSaving(true);
    try {
      await updateWorkspaceTheme(workspaceId, colors, user.id);
      toast.success('Theme updated successfully');
    } catch (error: any) {
      console.error('Error updating theme:', error);
      toast.error('Failed to update theme');
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    if (!workspaceId || !user?.id) return;

    setSaving(true);
    try {
      await resetWorkspaceTheme(workspaceId, user.id);
      
      // Update local state to defaults
      setColors(defaultColors);
      const hex: Record<string, string> = {};
      Object.entries(defaultColors).forEach(([key, hsl]) => {
        hex[key] = hslStringToHex(hsl);
      });
      setHexColors(hex);
      
      toast.success('Theme reset to defaults');
    } catch (error: any) {
      console.error('Error resetting theme:', error);
      toast.error('Failed to reset theme');
    } finally {
      setSaving(false);
    }
  };

  // Don't render if user doesn't have view permission
  if (!canView) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Theme Customization</CardTitle>
          <CardDescription>
            Customize the color scheme for your workspace portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading theme...</div>
        </CardContent>
      </Card>
    );
  }

  const cardContent = (
    <CardContent className="space-y-6">
        {/* Preset Themes Section */}
        {canEdit && (
          <div className="space-y-3 pb-6 border-b">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Preset Themes</Label>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Choose a preset theme to quickly apply a color scheme, or customize individual colors below.
            </p>
            <Select
              value={selectedPreset || ''}
              onValueChange={(value) => {
                const preset = THEME_PRESETS.find(p => p.name === value);
                if (preset) {
                  handleApplyPreset(preset);
                }
              }}
              disabled={!canEdit}
            >
              <SelectTrigger className="w-full">
                {selectedPreset ? (() => {
                  const preset = THEME_PRESETS.find(p => p.name === selectedPreset);
                  if (preset) {
                    return (
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex gap-1 shrink-0">
                          <div 
                            className="w-3 h-3 rounded border border-border/50"
                            style={{ backgroundColor: `hsl(${preset.colors.primary_color})` }}
                          />
                          <div 
                            className="w-3 h-3 rounded border border-border/50"
                            style={{ backgroundColor: `hsl(${preset.colors.secondary_color})` }}
                          />
                          <div 
                            className="w-3 h-3 rounded border border-border/50"
                            style={{ backgroundColor: `hsl(${preset.colors.accent_color})` }}
                          />
                        </div>
                        <span className="truncate">{preset.name}</span>
                      </div>
                    );
                  }
                  return <SelectValue>{selectedPreset}</SelectValue>;
                })() : (
                  <SelectValue placeholder="Select a preset theme..." />
                )}
              </SelectTrigger>
              <SelectContent>
                {/* White Themes */}
                {whiteThemes.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>White Themes</SelectLabel>
                    {whiteThemes.map((preset) => (
                      <SelectItem key={preset.name} value={preset.name} className="py-2">
                        <div className="flex items-center gap-3 w-full">
                          {/* Color Preview Icons */}
                          <div className="flex gap-1.5 shrink-0">
                            <div 
                              className="w-4 h-4 rounded border border-border/50"
                              style={{ backgroundColor: `hsl(${preset.colors.primary_color})` }}
                              title="Primary"
                            />
                            <div 
                              className="w-4 h-4 rounded border border-border/50"
                              style={{ backgroundColor: `hsl(${preset.colors.secondary_color})` }}
                              title="Secondary"
                            />
                            <div 
                              className="w-4 h-4 rounded border border-border/50"
                              style={{ backgroundColor: `hsl(${preset.colors.accent_color})` }}
                              title="Accent"
                            />
                          </div>
                          {/* Preset Name and Description */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">{preset.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {preset.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}

                {/* Light Themes */}
                {lightThemes.length > 0 && (
                  <>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Light Themes</SelectLabel>
                      {lightThemes.map((preset) => (
                        <SelectItem key={preset.name} value={preset.name} className="py-2">
                          <div className="flex items-center gap-3 w-full">
                            {/* Color Preview Icons */}
                            <div className="flex gap-1.5 shrink-0">
                              <div 
                                className="w-4 h-4 rounded border border-border/50"
                                style={{ backgroundColor: `hsl(${preset.colors.primary_color})` }}
                                title="Primary"
                              />
                              <div 
                                className="w-4 h-4 rounded border border-border/50"
                                style={{ backgroundColor: `hsl(${preset.colors.secondary_color})` }}
                                title="Secondary"
                              />
                              <div 
                                className="w-4 h-4 rounded border border-border/50"
                                style={{ backgroundColor: `hsl(${preset.colors.accent_color})` }}
                                title="Accent"
                              />
                            </div>
                            {/* Preset Name and Description */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{preset.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {preset.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </>
                )}

                {/* Deep Themes */}
                {deepThemes.length > 0 && (
                  <>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Deep Themes</SelectLabel>
                      {deepThemes.map((preset) => (
                        <SelectItem key={preset.name} value={preset.name} className="py-2">
                          <div className="flex items-center gap-3 w-full">
                            {/* Color Preview Icons */}
                            <div className="flex gap-1.5 shrink-0">
                              <div 
                                className="w-4 h-4 rounded border border-border/50"
                                style={{ backgroundColor: `hsl(${preset.colors.primary_color})` }}
                                title="Primary"
                              />
                              <div 
                                className="w-4 h-4 rounded border border-border/50"
                                style={{ backgroundColor: `hsl(${preset.colors.secondary_color})` }}
                                title="Secondary"
                              />
                              <div 
                                className="w-4 h-4 rounded border border-border/50"
                                style={{ backgroundColor: `hsl(${preset.colors.accent_color})` }}
                                title="Accent"
                              />
                            </div>
                            {/* Preset Name and Description */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{preset.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {preset.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Custom Color Controls */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Custom Colors</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {COLOR_FIELDS.map((field) => (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{field.label}</Label>
                  <div
                    className="w-12 h-8 rounded border"
                    style={{ backgroundColor: hexColors[field.key] || '#ffffff' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{field.description}</p>
                <ColorPicker
                  color={hexColors[field.key] || '#ffffff'}
                  onChange={(color) => handleColorChange(field.key, color)}
                  disabled={!canEdit}
                />
              </div>
            ))}
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save Theme'}
            </Button>
            <Button
              onClick={handleReset}
              disabled={saving}
              variant="outline"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
        )}
    </CardContent>
  );

  if (isCollapsible) {
    return (
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle>Theme Customization</CardTitle>
                <CardDescription>
                  Customize the color scheme for your workspace portal. Changes apply immediately when saved.
                </CardDescription>
              </div>
              <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", isOpen && "transform rotate-180")} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {cardContent}
        </CollapsibleContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Customization</CardTitle>
        <CardDescription>
          Customize the color scheme for your workspace portal. Changes apply immediately when saved.
        </CardDescription>
      </CardHeader>
      {cardContent}
    </Card>
  );
}

