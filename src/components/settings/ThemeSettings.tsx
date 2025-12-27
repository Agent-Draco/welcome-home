import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Palette, Plus, Trash2, Check, Sun, Moon } from 'lucide-react';
import { useTheme, FONT_OPTIONS, CustomTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function ThemeSettings() {
  const {
    activePreset,
    activeCustomTheme,
    customThemes,
    presets,
    selectPreset,
    selectCustomTheme,
    createCustomTheme,
    deleteCustomTheme,
  } = useTheme();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTheme, setNewTheme] = useState({
    name: '',
    primary_color: '178 60% 48%',
    secondary_color: '186 40% 65%',
    accent_color: '160 50% 50%',
    background_color: '180 30% 98%',
    foreground_color: '180 30% 10%',
    font_family: 'Inter',
    is_dark: false,
  });

  const handleCreateTheme = async () => {
    if (!newTheme.name.trim()) {
      toast({ title: 'Please enter a theme name', variant: 'destructive' });
      return;
    }

    const created = await createCustomTheme(newTheme);
    if (created) {
      toast({ title: 'Theme created!' });
      setIsCreateOpen(false);
      selectCustomTheme(created);
      setNewTheme({
        name: '',
        primary_color: '178 60% 48%',
        secondary_color: '186 40% 65%',
        accent_color: '160 50% 50%',
        background_color: '180 30% 98%',
        foreground_color: '180 30% 10%',
        font_family: 'Inter',
        is_dark: false,
      });
    }
  };

  const ColorInput = ({ 
    label, 
    value, 
    onChange 
  }: { 
    label: string; 
    value: string; 
    onChange: (val: string) => void;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex gap-2 items-center">
        <div 
          className="w-8 h-8 rounded-md border border-border"
          style={{ backgroundColor: `hsl(${value})` }}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="H S% L%"
          className="flex-1"
        />
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Presets */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Theme Presets</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => selectPreset(preset.id)}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all text-left",
                  activePreset === preset.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  {preset.isDark ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">{preset.name}</span>
                </div>
                <div className="flex gap-1">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: `hsl(${preset.primary})` }}
                  />
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: `hsl(${preset.secondary})` }}
                  />
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: `hsl(${preset.accent})` }}
                  />
                </div>
                {activePreset === preset.id && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Themes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Custom Themes</Label>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Theme
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Custom Theme</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Theme Name</Label>
                    <Input
                      value={newTheme.name}
                      onChange={(e) => setNewTheme(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="My Custom Theme"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Dark Mode</Label>
                    <Switch
                      checked={newTheme.is_dark}
                      onCheckedChange={(checked) => setNewTheme(prev => ({ ...prev, is_dark: checked }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Select
                      value={newTheme.font_family}
                      onValueChange={(val) => setNewTheme(prev => ({ ...prev, font_family: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.value }}>{font.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <ColorInput
                      label="Primary"
                      value={newTheme.primary_color}
                      onChange={(val) => setNewTheme(prev => ({ ...prev, primary_color: val }))}
                    />
                    <ColorInput
                      label="Secondary"
                      value={newTheme.secondary_color}
                      onChange={(val) => setNewTheme(prev => ({ ...prev, secondary_color: val }))}
                    />
                    <ColorInput
                      label="Accent"
                      value={newTheme.accent_color}
                      onChange={(val) => setNewTheme(prev => ({ ...prev, accent_color: val }))}
                    />
                    <ColorInput
                      label="Background"
                      value={newTheme.background_color}
                      onChange={(val) => setNewTheme(prev => ({ ...prev, background_color: val }))}
                    />
                    <ColorInput
                      label="Foreground"
                      value={newTheme.foreground_color}
                      onChange={(val) => setNewTheme(prev => ({ ...prev, foreground_color: val }))}
                    />
                  </div>

                  {/* Preview */}
                  <div 
                    className="p-4 rounded-xl border"
                    style={{ 
                      backgroundColor: `hsl(${newTheme.background_color})`,
                      color: `hsl(${newTheme.foreground_color})`,
                      fontFamily: newTheme.font_family,
                    }}
                  >
                    <p className="text-sm font-medium mb-2">Preview</p>
                    <div className="flex gap-2">
                      <div 
                        className="px-3 py-1 rounded text-sm text-white"
                        style={{ backgroundColor: `hsl(${newTheme.primary_color})` }}
                      >
                        Primary
                      </div>
                      <div 
                        className="px-3 py-1 rounded text-sm"
                        style={{ backgroundColor: `hsl(${newTheme.secondary_color})` }}
                      >
                        Secondary
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleCreateTheme} className="w-full">
                    Create Theme
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {customThemes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No custom themes yet. Create one to get started!
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {customThemes.map((theme) => (
                <div
                  key={theme.id}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all cursor-pointer",
                    activeCustomTheme?.id === theme.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => selectCustomTheme(theme)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {theme.is_dark ? (
                      <Moon className="h-4 w-4" />
                    ) : (
                      <Sun className="h-4 w-4" />
                    )}
                    <span className="text-sm font-medium truncate">{theme.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: `hsl(${theme.primary_color})` }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: `hsl(${theme.secondary_color})` }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: `hsl(${theme.accent_color})` }}
                    />
                  </div>
                  {activeCustomTheme?.id === theme.id && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCustomTheme(theme.id);
                    }}
                    className="absolute bottom-2 right-2 p-1 rounded hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
