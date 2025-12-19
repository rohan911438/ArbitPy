import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Play, Eye, Loader2, ExternalLink, Copy, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { executeFunction, simulateFunction } from '../../lib/api';
import { useAppStore } from '../../stores/appStore';

interface FunctionExecutionPanelProps {
  contractAddress?: string;
  abi?: any[];
  network?: string;
}

const FunctionExecutionPanel: React.FC<FunctionExecutionPanelProps> = ({
  contractAddress: initialAddress,
  abi: initialAbi,
  network = 'arbitrum_sepolia'
}) => {
  const { toast } = useToast();
  const { solidityCompilationResult, rustCompilationResult } = useAppStore();
  
  const [contractAddress, setContractAddress] = useState(initialAddress || '');
  const [abi, setAbi] = useState<any[]>(initialAbi || []);
  const [selectedFunction, setSelectedFunction] = useState<any>(null);
  const [parameters, setParameters] = useState<string[]>([]);
  const [privateKey, setPrivateKey] = useState('');
  const [gasLimit, setGasLimit] = useState('');
  const [gasPrice, setGasPrice] = useState('');
  const [value, setValue] = useState('0');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [executionResults, setExecutionResults] = useState<any[]>([]);

  // Load ABI from compilation results if available
  useEffect(() => {
    if (!abi.length) {
      const compilationResult = solidityCompilationResult || rustCompilationResult;
      if (compilationResult?.abi) {
        setAbi(compilationResult.abi);
      }
    }
  }, [solidityCompilationResult, rustCompilationResult, abi.length]);

  // Filter functions from ABI
  const functions = abi.filter(item => item.type === 'function');
  const readFunctions = functions.filter(fn => fn.stateMutability === 'view' || fn.stateMutability === 'pure');
  const writeFunctions = functions.filter(fn => fn.stateMutability !== 'view' && fn.stateMutability !== 'pure');

  const handleFunctionSelect = (functionName: string) => {
    const func = functions.find(f => f.name === functionName);
    setSelectedFunction(func);
    if (func) {
      setParameters(new Array(func.inputs?.length || 0).fill(''));
    }
  };

  const handleParameterChange = (index: number, value: string) => {
    const newParams = [...parameters];
    newParams[index] = value;
    setParameters(newParams);
  };

  const parseParameters = (func: any, rawParams: string[]) => {
    return rawParams.map((param, index) => {
      const inputType = func.inputs[index]?.type;
      if (!param.trim()) return param;

      try {
        if (inputType?.includes('uint') || inputType?.includes('int')) {
          return param.trim();
        } else if (inputType === 'bool') {
          return param.toLowerCase() === 'true';
        } else if (inputType?.includes('[]')) {
          return JSON.parse(param);
        }
        return param;
      } catch (e) {
        return param;
      }
    });
  };

  const handleExecute = async () => {
    if (!contractAddress || !selectedFunction) {
      toast({
        title: 'Missing Information',
        description: 'Please provide contract address and select a function',
        variant: 'destructive',
      });
      return;
    }

    const isReadOnly = selectedFunction.stateMutability === 'view' || selectedFunction.stateMutability === 'pure';
    
    if (!isReadOnly && !privateKey) {
      toast({
        title: 'Private Key Required',
        description: 'Write operations require a private key',
        variant: 'destructive',
      });
      return;
    }

    setIsExecuting(true);

    try {
      const parsedParams = parseParameters(selectedFunction, parameters);
      
      const result = await executeFunction(
        contractAddress,
        abi,
        selectedFunction.name,
        parsedParams,
        network,
        privateKey || undefined,
        {
          gasLimit: gasLimit || undefined,
          gasPrice: gasPrice || undefined,
          value: value || '0'
        }
      );

      const newResult = {
        id: Date.now(),
        timestamp: new Date(),
        functionName: selectedFunction.name,
        type: isReadOnly ? 'read' : 'write',
        parameters: parsedParams,
        ...result
      };

      setExecutionResults([newResult, ...executionResults]);

      if (result.success) {
        toast({
          title: 'Function Executed Successfully',
          description: isReadOnly 
            ? `Read operation completed`
            : `Transaction sent: ${result.txHash}`,
        });
      } else {
        toast({
          title: 'Execution Failed',
          description: result.error,
          variant: 'destructive',
        });
      }

    } catch (error) {
      toast({
        title: 'Execution Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSimulate = async () => {
    if (!contractAddress || !selectedFunction) {
      toast({
        title: 'Missing Information',
        description: 'Please provide contract address and select a function',
        variant: 'destructive',
      });
      return;
    }

    setIsSimulating(true);

    try {
      const parsedParams = parseParameters(selectedFunction, parameters);
      
      const result = await simulateFunction(
        contractAddress,
        abi,
        selectedFunction.name,
        parsedParams,
        network
      );

      const newResult = {
        id: Date.now(),
        timestamp: new Date(),
        functionName: selectedFunction.name,
        type: 'simulation',
        parameters: parsedParams,
        ...result
      };

      setExecutionResults([newResult, ...executionResults]);

      if (result.success) {
        toast({
          title: 'Simulation Completed',
          description: 'Function simulation successful',
        });
      } else {
        toast({
          title: 'Simulation Failed',
          description: result.error,
          variant: 'destructive',
        });
      }

    } catch (error) {
      toast({
        title: 'Simulation Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Function Execution Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Function Execution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contract-address">Contract Address</Label>
            <Input
              id="contract-address"
              placeholder="0x..."
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
            />
          </div>

          {abi.length === 0 && (
            <div className="space-y-2">
              <Label htmlFor="abi-input">Contract ABI (JSON)</Label>
              <Textarea
                id="abi-input"
                placeholder="Paste contract ABI here..."
                className="h-24"
                onChange={(e) => {
                  try {
                    const parsedAbi = JSON.parse(e.target.value);
                    setAbi(parsedAbi);
                  } catch (error) {
                    // Invalid JSON, ignore
                  }
                }}
              />
            </div>
          )}

          {functions.length > 0 && (
            <div className="space-y-2">
              <Label>Select Function</Label>
              <Select onValueChange={handleFunctionSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a function to execute" />
                </SelectTrigger>
                <SelectContent>
                  {readFunctions.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-sm font-medium text-green-600">Read Functions</div>
                      {readFunctions.map((func) => (
                        <SelectItem key={func.name} value={func.name}>
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-green-500" />
                            {func.name}
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                  
                  {writeFunctions.length > 0 && (
                    <>
                      {readFunctions.length > 0 && <Separator />}
                      <div className="px-2 py-1 text-sm font-medium text-orange-600">Write Functions</div>
                      {writeFunctions.map((func) => (
                        <SelectItem key={func.name} value={func.name}>
                          <div className="flex items-center gap-2">
                            <Play className="w-4 h-4 text-orange-500" />
                            {func.name}
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedFunction && selectedFunction.inputs?.length > 0 && (
            <div className="space-y-2">
              <Label>Function Parameters</Label>
              {selectedFunction.inputs.map((input: any, index: number) => (
                <div key={index} className="space-y-1">
                  <Label className="text-sm text-muted-foreground">
                    {input.name || `param${index}`} ({input.type})
                  </Label>
                  <Input
                    placeholder={`Enter ${input.type} value`}
                    value={parameters[index] || ''}
                    onChange={(e) => handleParameterChange(index, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {selectedFunction && selectedFunction.stateMutability !== 'view' && selectedFunction.stateMutability !== 'pure' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="private-key">Private Key (for write operations)</Label>
                <Input
                  id="private-key"
                  type="password"
                  placeholder="0x..."
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="gas-limit">Gas Limit (optional)</Label>
                  <Input
                    id="gas-limit"
                    placeholder="3000000"
                    value={gasLimit}
                    onChange={(e) => setGasLimit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">ETH Value</Label>
                  <Input
                    id="value"
                    placeholder="0"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {selectedFunction && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleExecute}
                disabled={isExecuting || isSimulating}
                className="flex-1"
              >
                {isExecuting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Execute
              </Button>
              <Button
                variant="outline"
                onClick={handleSimulate}
                disabled={isExecuting || isSimulating}
              >
                {isSimulating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                Simulate
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution Results */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {executionResults.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No function executions yet
              </div>
            ) : (
              <div className="space-y-4">
                {executionResults.map((result) => (
                  <Card key={result.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="font-medium">{result.functionName}</span>
                          <Badge variant={
                            result.type === 'read' ? 'secondary' : 
                            result.type === 'write' ? 'default' : 
                            'outline'
                          }>
                            {result.type}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {result.timestamp.toLocaleTimeString()}
                        </span>
                      </div>

                      {result.parameters.length > 0 && (
                        <div className="mb-2">
                          <Label className="text-xs text-muted-foreground">Parameters:</Label>
                          <div className="text-sm font-mono bg-muted p-2 rounded">
                            {JSON.stringify(result.parameters)}
                          </div>
                        </div>
                      )}

                      {result.success && result.result !== undefined && (
                        <div className="mb-2">
                          <Label className="text-xs text-muted-foreground">Result:</Label>
                          <div className="text-sm font-mono bg-muted p-2 rounded">
                            {typeof result.result === 'object' 
                              ? JSON.stringify(result.result, null, 2) 
                              : String(result.result)
                            }
                          </div>
                        </div>
                      )}

                      {result.txHash && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Transaction:</span>
                          <code className="bg-muted px-1 rounded">{result.txHash.slice(0, 10)}...</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(result.txHash)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          {result.explorerUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(result.explorerUrl, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      )}

                      {result.gasUsed && (
                        <div className="text-xs text-muted-foreground">
                          Gas used: {result.gasUsed}
                        </div>
                      )}

                      {!result.success && result.error && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          Error: {result.error}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default FunctionExecutionPanel;