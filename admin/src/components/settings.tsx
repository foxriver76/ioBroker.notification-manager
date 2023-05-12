import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { CreateCSSProperties } from '@material-ui/core/styles/withStyles';
import TextField from '@material-ui/core/TextField';
import Input from '@material-ui/core/Input';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import I18n from '@iobroker/adapter-react-v5/i18n';
import { Connection } from '@iobroker/socket-client';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const styles = (): Record<string, CreateCSSProperties> => ({
    input: {
        marginTop: 0,
        minWidth: 400,
    },
    button: {
        marginRight: 20,
    },
    card: {
        textAlign: 'left',
        margin: 10,
    },
    cardHeaderDark: {
        backgroundColor: '#272727',
        color: 'white',
    },
    cardHeader: {
        backgroundColor: 'white',
    },
    media: {
        height: 180,
    },
    column: {
        display: 'inline-block',
        verticalAlign: 'top',
        marginRight: 20,
    },
    columnLogo: {
        width: 350,
        marginRight: 0,
    },
    columnSettings: {
        width: 'calc(100% - 370px)',
    },
    controlElement: {
        //background: "#d2d2d2",
        marginBottom: 5,
    },
    settingsRoot: {
        height: '100%',
        overflow: 'scroll',
    },
});

interface ConfiguredCategories {
    [scope: string]: {
        [category: string]: {
            /** Try to first let this adapter handle the notification */
            firstAdapter: string;
            /** If first adapter fails, try this one */
            secondAdapter: string;
        };
    };
}

/** e.g. "scope.category.firstAdapter" */
type ConfigurationCategoryAttribute = `${string}.${string}.${string}`;

type NotificationsConfig = Notifications[];

export interface AdapterNative {
    categories: ConfiguredCategories;
}

interface Notifications {
    /** the scope id */
    scope: string;
    description: Record<string, string>;
    name: Record<string, string>;
    categories: NotificationCategory[];
}

interface NotificationCategory {
    /** the category id */
    category: string;
    severity: 'alert' | 'notify' | 'info';
    description: Record<string, string>;
    name: Record<string, string>;
    limit: number;
    regex: RegExp[];
}

interface SettingsProps {
    classes: Record<string, string>;
    /** The io-pack native attributes */
    native: AdapterNative;
    onChange: (attr: string, value: any) => void;
    /** the adapter namespace */
    namespace: string;
    /** the active language */
    language: string;
    /** the active theme */
    theme: 'dark' | 'light';
}

interface SettingsState {
    /** The notifications config from controller */
    notificationsConfig?: NotificationsConfig;
    /** id for each card and open status */
    cardOpen: Record<string, boolean>;
    /** all instances that can be used to handle notifications */
    supportedAdapterInstances: string[];
}

class Settings extends React.Component<SettingsProps, SettingsState> {
    constructor(props: SettingsProps) {
        super(props);
        this.state = { cardOpen: {}, supportedAdapterInstances: [] };
    }

    renderInput(title: AdminWord, attr: string, type: string) {
        return (
            <TextField
                label={I18n.t(title)}
                className={`${this.props.classes.input} ${this.props.classes.controlElement}`}
                value={this.props.native[attr]}
                type={type || 'text'}
                onChange={(e) => this.props.onChange(attr, e.target.value)}
                margin="normal"
            />
        );
    }

    /**
     * Renders the adapter selection checkbox
     *
     * @param title the title from i18n
     * @param attr the attribute path of native
     * @param options title and value of every option
     * @param style additional css style
     */
    renderAdapterSelect(
        title: AdminWord,
        attr: ConfigurationCategoryAttribute,
        options: { value: string; title: string }[],
        style?: React.CSSProperties,
    ) {
        const [scope, category, adapterOrder] = attr.split('.');
        console.info(this.props.native);

        return (
            <FormControl
                className={`${this.props.classes.input} ${this.props.classes.controlElement}`}
                style={{
                    paddingTop: 5,
                    ...style,
                }}
            >
                <Select
                    value={this.props.native[scope]?.[category]?.[adapterOrder] || '_'}
                    onChange={(e) => {
                        const val = this.preprocessAdapterSelection(attr, e.target.value === '_' ? '' : e.target.value);
                        this.props.onChange('categories', val);
                    }}
                    input={<Input name={attr} id={attr + '-helper'} />}
                >
                    {options.map((item) => (
                        <MenuItem key={'key-' + item.value} value={item.value || '_'}>
                            {item.title}
                        </MenuItem>
                    ))}
                </Select>
                <FormHelperText>{I18n.t(title)}</FormHelperText>
            </FormControl>
        );
    }

    /**
     * Preprocess single selection to extend the global native object
     *
     * @param attrPath path to the attribute like "scope.category.firstAdapter"
     * @param value the adapter instance
     */
    preprocessAdapterSelection(attrPath: ConfigurationCategoryAttribute, value: unknown): ConfiguredCategories {
        const [scope, category, adapterOrder] = attrPath.split('.');

        const categories = this.props.native.categories;

        if (!categories[scope]) {
            categories[scope] = {};
        }

        if (!categories[scope][category]) {
            categories[scope][category] = { firstAdapter: '', secondAdapter: '' };
        }

        categories[scope][category][adapterOrder] = value;

        return categories;
    }

    renderCheckbox(title: AdminWord, attr: string, style?: React.CSSProperties) {
        return (
            <FormControlLabel
                key={attr}
                style={{
                    paddingTop: 5,
                    ...style,
                }}
                className={this.props.classes.controlElement}
                control={
                    <Checkbox
                        checked={this.props.native[attr]}
                        onChange={() => this.props.onChange(attr, !this.props.native[attr])}
                        color="primary"
                    />
                }
                label={I18n.t(title)}
            />
        );
    }

    /**
     * Render a card for the category
     *
     * @param scopeId id of the scope
     * @param category the notification category to render card for
     */
    renderCategoryCard(scopeId: string, category: NotificationCategory) {
        const elementId = category.name['en'];

        return (
            <>
                <Card
                    sx={{
                        minWidth: 400,
                        border: this.isDarkMode() ? '1px solid rgba(58,58,58,0.6)' : '1px solid rgba(211,211,211,0.6)',
                    }}
                    className={this.props.classes.card}
                >
                    <CardHeader
                        className={
                            this.isDarkMode() ? this.props.classes.cardHeaderDark : this.props.classes.cardHeader
                        }
                        title={category.name[this.props.language]}
                        action={
                            <IconButton
                                onClick={() => {
                                    this.setState({
                                        cardOpen: {
                                            ...this.state.cardOpen,
                                            [elementId]: !this.state.cardOpen[elementId],
                                        },
                                    });
                                }}
                                aria-label="expand"
                                size="small"
                                style={{ color: this.isDarkMode() ? 'white' : 'black' }}
                            >
                                {this.state.cardOpen[elementId] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                        }
                    ></CardHeader>
                    <div style={{ backgroundColor: this.props.theme === 'dark' ? '#3b3b3b' : 'rgba(211,211,211,0.4)' }}>
                        <Collapse in={this.state.cardOpen[elementId]} timeout="auto" unmountOnExit>
                            <CardContent>
                                <Container sx={{ lineHeight: 2, color: this.isDarkMode() ? 'white' : 'black' }}>
                                    {category.description[this.props.language]}
                                    <br />
                                    {this.renderAdapterSelect(
                                        `firstAdapter`,
                                        `${scopeId}.${category.category}.firstAdapter`,
                                        this.state.supportedAdapterInstances.map((instance) => {
                                            return { value: instance, title: instance };
                                        }),
                                        {},
                                    )}
                                    <br />
                                    {this.renderAdapterSelect(
                                        'secondAdapter',
                                        `${scopeId}.${category.category}.secondAdapter`,
                                        this.state.supportedAdapterInstances.map((instance) => {
                                            return { value: instance, title: instance };
                                        }),
                                        {},
                                    )}
                                </Container>
                            </CardContent>
                        </Collapse>
                    </div>
                </Card>
            </>
        );
    }

    render(): React.JSX.Element {
        if (!this.state.notificationsConfig) {
            return (
                <div>
                    <h2 style={{ color: this.isDarkMode() ? 'white' : 'black' }}>{I18n.t('notRunning')}</h2>
                </div>
            );
        }

        return (
            <form className={this.props.classes.tab}>
                {this.state.notificationsConfig.map((scope) => {
                    return (
                        <div key={'settings-root'} className={this.props.classes.settingsRoot}>
                            <h2 style={{ color: this.getTextColor(), margin: 10 }} key={scope.scope}>
                                {scope.name[this.props.language]}
                            </h2>
                            {scope.categories.map((category) => {
                                return this.renderCategoryCard(scope.scope, category);
                            })}
                        </div>
                    );
                })}
            </form>
        );
    }

    /**
     * React lifecycle hook, called when mounted
     */
    async componentDidMount() {
        const conn = new Connection({});

        await conn.waitForFirstConnection();

        try {
            const { notifications: notificationsConfig } = await conn.sendTo(this.props.namespace, 'getCategories');
            const { instances: supportedAdapterInstances } = await conn.sendTo(
                this.props.namespace,
                'getSupportedMessengers',
            );
            this.setState({ notificationsConfig, supportedAdapterInstances });
        } catch (e: any) {
            console.error(`Backend communication failed: ${e.message}`);
        }
    }

    /**
     * Get text color according to theme
     */
    getTextColor(): string {
        return this.props.theme === 'dark' ? 'white' : 'black';
    }

    /**
     * Determine if dark mode is active
     */
    isDarkMode(): boolean {
        return this.props.theme === 'dark';
    }
}

export default withStyles(styles)(Settings);
